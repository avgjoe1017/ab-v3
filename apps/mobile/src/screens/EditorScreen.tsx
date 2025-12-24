import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, ScrollView, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useDraftStore } from "../state/useDraftStore";
import { apiPost } from "../lib/api";
import { SessionV3Schema, type SessionV3 } from "@ab/contracts";
import { useAuthToken } from "../lib/auth";
import { getUserStruggle } from "../lib/values";

export default function EditorScreen({ navigation }: any) {
    const { draft, updateDraft, addAffirmation, removeAffirmation, clearDraft } = useDraftStore();
    const [newAffirmation, setNewAffirmation] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const authToken = useAuthToken();

    // If no draft, nav back (shouldn't happen if properly initialized)
    useEffect(() => {
        if (!draft) navigation.goBack();
    }, [draft, navigation]);

    if (!draft) return null;

    const handleGenerateAffirmations = async () => {
        if (!draft.title.trim()) {
            Alert.alert("Title Required", "Please enter a session title before generating affirmations.");
            return;
        }

        try {
            setIsGenerating(true);

            // Fetch user values and struggle if available
            let userValues: string[] = [];
            let userStruggle: string | undefined = undefined;

            try {
                const valuesResponse = await getUserValues(authToken);
                userValues = valuesResponse.values.map(v => v.valueText);
            } catch (err) {
                console.log("[Editor] Could not fetch user values, using empty array");
            }

            try {
                const struggleResponse = await getUserStruggle(authToken);
                userStruggle = struggleResponse.struggle || undefined;
            } catch (err) {
                console.log("[Editor] Could not fetch user struggle, skipping");
            }

            // Determine session type from goalTag or title
            const sessionType = draft.goalTag || 
                (draft.title.toLowerCase().includes("focus") ? "Focus" :
                 draft.title.toLowerCase().includes("sleep") ? "Sleep" :
                 draft.title.toLowerCase().includes("meditate") ? "Meditate" :
                 draft.title.toLowerCase().includes("anxiety") ? "Anxiety Relief" :
                 "Meditate");

            // Call affirmation generation API
            // Pass the user's written goal (title) as the primary input
            const response = await apiPost<{ affirmations: string[]; reasoning?: string }>(
                "/affirmations/generate",
                {
                    sessionType,
                    struggle: userStruggle,
                    goal: draft.title.trim(), // User's written goal - this is the most important input
                    count: 4, // Default to 4 affirmations
                },
                authToken
            );

            // Replace current affirmations with generated ones
            updateDraft({ affirmations: response.affirmations });

            if (response.reasoning) {
                console.log("[Editor] Generation reasoning:", response.reasoning);
            }

            Alert.alert(
                "Affirmations Generated",
                `Generated ${response.affirmations.length} personalized affirmations. You can edit them before saving.`
            );
        } catch (error) {
            console.error("[Editor] Failed to generate affirmations:", error);
            Alert.alert(
                "Generation Failed",
                error instanceof Error 
                    ? error.message 
                    : "Could not generate affirmations. Please check your connection and try again, or add affirmations manually."
            );
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            // Validate minimal requirements
            if (!draft.title.trim()) {
                alert("Please enter a title");
                setIsSaving(false);
                return;
            }
            // Allow saving without affirmations - backend will generate them during audio generation
            // This enables the core AI workflow where users can create sessions and let AI generate affirmations

            console.log("Saving draft...", draft);

            const res = await apiPost<SessionV3>("/sessions", draft, authToken);
            // Validate response basic shape to ensure type safety
            // In a real app we'd parse with Zod
            console.log("Session created:", res);

            // Clear draft and go to player
            clearDraft();
            navigation.replace("Player", { sessionId: res.id });

        } catch (e) {
            console.error("Failed to save session:", e);
            alert("Failed to save session. Check logs/server.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>New Session</Text>

            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                    style={styles.input}
                    value={draft.title}
                    onChangeText={(t) => updateDraft({ title: t })}
                    placeholder="e.g. Morning Confidence"
                />

                <Text style={styles.label}>Goal Tag</Text>
                <TextInput
                    style={styles.input}
                    value={draft.goalTag}
                    onChangeText={(t) => updateDraft({ goalTag: t })}
                    placeholder="e.g. Focus"
                />

                <View style={styles.affirmationsSection}>
                    <View style={styles.affirmationsHeader}>
                        <Text style={styles.label}>Affirmations</Text>
                        <Button
                            title={isGenerating ? "Generating..." : "Generate with AI"}
                            onPress={handleGenerateAffirmations}
                            disabled={isGenerating}
                        />
                    </View>
                    {isGenerating && (
                        <View style={styles.generatingContainer}>
                            <ActivityIndicator size="small" color="#007AFF" />
                            <Text style={styles.generatingText}>Generating personalized affirmations...</Text>
                        </View>
                    )}
                    {draft.affirmations.length === 0 && !isGenerating && (
                        <Text style={styles.hintText}>
                            No affirmations yet. Click "Generate with AI" to create personalized affirmations, or add them manually below.
                        </Text>
                    )}
                    {draft.affirmations.map((aff, i) => (
                        <View key={i} style={styles.affRow}>
                            <Text style={styles.affText}>{i + 1}. {aff}</Text>
                            <Button title="X" onPress={() => removeAffirmation(i)} color="red" />
                        </View>
                    ))}
                </View>

                <View style={styles.addAffRow}>
                    <TextInput
                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                        value={newAffirmation}
                        onChangeText={setNewAffirmation}
                        placeholder="Type affirmation..."
                        onSubmitEditing={() => {
                            if (newAffirmation.trim()) {
                                addAffirmation(newAffirmation.trim());
                                setNewAffirmation("");
                            }
                        }}
                    />
                    <Button title="Add" onPress={() => {
                        if (newAffirmation.trim()) {
                            addAffirmation(newAffirmation.trim());
                            setNewAffirmation("");
                        }
                    }} />
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Button title={isSaving ? "Saving..." : "Create & Generate"} onPress={handleSave} disabled={isSaving} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: "#fff" },
    header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
    scroll: { paddingBottom: 100 },
    label: { fontSize: 16, fontWeight: "600", marginTop: 12, marginBottom: 6 },
    input: { borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16 },
    affirmationsSection: { marginBottom: 12 },
    affirmationsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    generatingContainer: { flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: "#f0f8ff", borderRadius: 8, marginBottom: 12 },
    generatingText: { marginLeft: 8, color: "#007AFF", fontSize: 14 },
    hintText: { fontSize: 14, color: "#666", fontStyle: "italic", marginBottom: 12, padding: 8, backgroundColor: "#f9f9f9", borderRadius: 8 },
    affRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: 8, backgroundColor: "#f9f9f9", borderRadius: 8 },
    affText: { flex: 1, fontSize: 16 },
    addAffRow: { flexDirection: "row", gap: 10, marginTop: 10 },
    footer: { borderTopWidth: 1, borderColor: "#eee", paddingVertical: 16 }
});
