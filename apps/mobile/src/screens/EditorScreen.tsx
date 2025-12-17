import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, ScrollView, StyleSheet } from "react-native";
import { useDraftStore } from "../state/useDraftStore";
import { apiPost } from "../lib/api";
import { SessionV3Schema, type SessionV3 } from "@ab/contracts";
import { useAuthToken } from "../lib/auth";

export default function EditorScreen({ navigation }: any) {
    const { draft, updateDraft, addAffirmation, removeAffirmation, clearDraft } = useDraftStore();
    const [newAffirmation, setNewAffirmation] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const authToken = useAuthToken();

    // If no draft, nav back (shouldn't happen if properly initialized)
    useEffect(() => {
        if (!draft) navigation.goBack();
    }, [draft, navigation]);

    if (!draft) return null;

    const handleSave = async () => {
        try {
            setIsSaving(true);
            // Validate minimal requirements
            if (!draft.title.trim()) {
                alert("Please enter a title");
                setIsSaving(false);
                return;
            }
            if (draft.affirmations.length === 0) {
                alert("Please add at least one affirmation");
                setIsSaving(false);
                return;
            }

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

                <Text style={styles.label}>Affirmations</Text>
                {draft.affirmations.map((aff, i) => (
                    <View key={i} style={styles.affRow}>
                        <Text style={styles.affText}>{i + 1}. {aff}</Text>
                        <Button title="X" onPress={() => removeAffirmation(i)} color="red" />
                    </View>
                ))}

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
    affRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: 8, backgroundColor: "#f9f9f9", borderRadius: 8 },
    affText: { flex: 1, fontSize: 16 },
    addAffRow: { flexDirection: "row", gap: 10, marginTop: 10 },
    footer: { borderTopWidth: 1, borderColor: "#eee", paddingVertical: 16 }
});
