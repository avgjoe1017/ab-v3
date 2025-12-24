/**
 * Quick Generate Flow Component
 * Handles the quick generate path: goal input → generation → review gate → start
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from "react-native";
import { useAuthToken } from "../../lib/auth";
import { getUserStruggle } from "../../lib/values";
import { apiPost } from "../../lib/api";
import type { SessionV3 } from "@ab/contracts";
import { PrimaryButton } from "../../components";
import { theme } from "../../theme";
import type { AffirmationPack } from "../../lib/affirmationPack";
import { decideAudioSettings, packToSessionPayload } from "../../lib/affirmationPack";
import { useDraftStore } from "../../state/useDraftStore";

interface QuickGenerateFlowProps {
  navigation: any;
}

export function QuickGenerateFlow({ navigation }: QuickGenerateFlowProps) {
  const authToken = useAuthToken();
  const { draft } = useDraftStore();
  const [quickGoal, setQuickGoal] = useState("");
  const [quickContext, setQuickContext] = useState("");
  const [showQuickContext, setShowQuickContext] = useState(false);
  const [quickLength, setQuickLength] = useState<6 | 12 | 18>(12);
  const [isQuickGenerating, setIsQuickGenerating] = useState(false);
  const [quickPack, setQuickPack] = useState<AffirmationPack | null>(null);

  // Pre-fill goal from draft if available (from HomeScreen) and auto-generate
  useEffect(() => {
    if (draft?.title && !quickGoal && !isQuickGenerating && !quickPack) {
      const goal = draft.title.trim();
      if (goal.length >= 2 && goal.length <= 140) {
        setQuickGoal(goal);
        // Auto-trigger generation after a brief delay to ensure state is set
        const timer = setTimeout(() => {
          handleQuickGenerateWithGoal(goal);
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [draft?.title, quickGoal, isQuickGenerating, quickPack, handleQuickGenerateWithGoal]);

  const handleQuickGenerateWithGoal = useCallback(async (goal: string) => {
    if (!goal.trim() || goal.length < 2 || goal.length > 140) {
      return;
    }

    try {
      setIsQuickGenerating(true);
      setQuickGoal(goal); // Ensure state is set

      // Fetch user struggle
      let userStruggle: string | undefined;

      try {
        const struggleResponse = await getUserStruggle(authToken);
        userStruggle = struggleResponse.struggle || undefined;
      } catch (err) {
        console.log("[AIAffirmation] Could not fetch user struggle");
      }

      // Build session type from goal
      const goalLower = goal.toLowerCase();
      let sessionType = "Meditate";
      if (goalLower.includes("focus") || goalLower.includes("work") || goalLower.includes("concentration")) {
        sessionType = "Focus";
      } else if (goalLower.includes("sleep") || goalLower.includes("rest")) {
        sessionType = "Sleep";
      } else if (goalLower.includes("anxiety") || goalLower.includes("calm")) {
        sessionType = "Anxiety Relief";
      }

      // Generate affirmations
      const response = await apiPost<{ affirmations: string[]; reasoning?: string }>(
        "/affirmations/generate",
        {
          sessionType,
          struggle: userStruggle || quickContext || undefined,
          goal: goal, // User's written goal - most important input
          count: quickLength,
        },
        authToken
      );

      // Auto-select audio settings
      const audioSettings = decideAudioSettings(goal);

      // Create pack for review gate
      const pack: AffirmationPack = {
        goal: goal,
        context: quickContext || undefined,
        affirmations: response.affirmations,
        style: "balanced",
        length: quickLength,
        audioSettings,
      };

      setQuickPack(pack);
      setIsQuickGenerating(false);
    } catch (error) {
      console.error("[AIAffirmation] Failed to generate:", error);
      Alert.alert(
        "Generation Failed",
        error instanceof Error ? error.message : "Could not generate affirmations. Please try again."
      );
      setIsQuickGenerating(false);
    }
  }, [authToken, quickContext, quickLength]);

  const handleQuickGenerate = async () => {
    if (!quickGoal.trim() || quickGoal.length < 2 || quickGoal.length > 140) {
      Alert.alert("Invalid Goal", "Goal must be 2-140 characters.");
      return;
    }
    await handleQuickGenerateWithGoal(quickGoal);
  };

  const handleQuickStart = async () => {
    if (!quickPack) return;

    try {
      const payload = packToSessionPayload(quickPack);
      const res = await apiPost<SessionV3>("/sessions", payload, authToken);
      navigation.navigate("Player", { sessionId: res.id });
    } catch (error) {
      console.error("[AIAffirmation] Failed to create session:", error);
      Alert.alert("Failed to Start", "Could not create session. Please try again.");
    }
  };

  if (quickPack) {
    // Review Gate
    return (
      <View style={styles.reviewGate}>
        <Text style={styles.reviewTitle}>Here's what we made. Edit anything.</Text>

        {/* Affirmations Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.previewLabel}>Affirmations (first 6)</Text>
          {quickPack.affirmations.slice(0, 6).map((aff, i) => (
            <Text key={i} style={styles.previewAffirmation}>
              {i + 1}. {aff}
            </Text>
          ))}
          {quickPack.affirmations.length > 6 && (
            <Text style={styles.previewMore}>+ {quickPack.affirmations.length - 6} more</Text>
          )}
          <Pressable onPress={() => {/* TODO: Navigate to edit */}}>
            <Text style={styles.editLink}>Edit</Text>
          </Pressable>
        </View>

        {/* Audio Summary */}
        <View style={styles.audioSummary}>
          <View style={styles.audioChip}>
            <Text style={styles.audioChipLabel}>Voice:</Text>
            <Text style={styles.audioChipValue}>{quickPack.audioSettings.voiceId}</Text>
            <Pressable onPress={() => {/* TODO: Change voice */}}>
              <Text style={styles.changeLink}>Change</Text>
            </Pressable>
          </View>
          <View style={styles.audioChip}>
            <Text style={styles.audioChipLabel}>Brain layer:</Text>
            <Text style={styles.audioChipValue}>
              {quickPack.audioSettings.brainLayerType} {quickPack.audioSettings.brainLayerPreset}
            </Text>
            <Pressable onPress={() => {/* TODO: Change brain layer */}}>
              <Text style={styles.changeLink}>Change</Text>
            </Pressable>
          </View>
          <View style={styles.audioChip}>
            <Text style={styles.audioChipLabel}>Background:</Text>
            <Text style={styles.audioChipValue}>{quickPack.audioSettings.backgroundId}</Text>
            <Pressable onPress={() => {/* TODO: Change background */}}>
              <Text style={styles.changeLink}>Change</Text>
            </Pressable>
          </View>
        </View>

        <PrimaryButton label="Start Session" onPress={handleQuickStart} style={styles.startButton} />
      </View>
    );
  }

  // Input Form
  return (
    <>
      {/* Goal Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Goal</Text>
        <TextInput
          style={styles.input}
          value={quickGoal}
          onChangeText={setQuickGoal}
          placeholder="What do you want to work on today?"
          multiline
          maxLength={140}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{quickGoal.length}/140</Text>

        {!showQuickContext && (
          <Pressable onPress={() => setShowQuickContext(true)} style={styles.expandButton}>
            <Text style={styles.expandText}>+ Add context</Text>
          </Pressable>
        )}

        {showQuickContext && (
          <TextInput
            style={[styles.input, styles.contextInput]}
            value={quickContext}
            onChangeText={setQuickContext}
            placeholder="Optional: Add more details..."
            multiline
            textAlignVertical="top"
          />
        )}
      </View>

      {/* Number of Affirmations */}
      <View style={styles.lengthSelector}>
        <Text style={styles.label}>Number of Affirmations</Text>
        <View style={styles.lengthOptions}>
          {([6, 12, 18] as const).map((len) => (
            <Pressable
              key={len}
              style={[styles.lengthOption, quickLength === len && styles.lengthOptionActive]}
              onPress={() => setQuickLength(len)}
            >
              <Text style={[styles.lengthOptionText, quickLength === len && styles.lengthOptionTextActive]}>
                {len}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Text style={styles.helperText}>
        We'll pick the voice, brain layer, and background based on your goal.
      </Text>

      <PrimaryButton
        label={isQuickGenerating ? "Generating..." : "Generate + Start"}
        onPress={handleQuickGenerate}
        disabled={isQuickGenerating || !quickGoal.trim()}
        style={styles.generateButton}
      />
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: theme.spacing[6],
  },
  label: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.md,
    padding: theme.spacing[4],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    minHeight: 100,
  },
  contextInput: {
    marginTop: theme.spacing[2],
    minHeight: 60,
  },
  charCount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    textAlign: "right",
    marginTop: theme.spacing[1],
  },
  expandButton: {
    marginTop: theme.spacing[2],
  },
  expandText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.accent.primary,
  },
  lengthSelector: {
    marginTop: theme.spacing[2],
  },
  lengthOptions: {
    flexDirection: "row",
    gap: theme.spacing[2],
    marginTop: theme.spacing[2],
  },
  lengthOption: {
    flex: 1,
    padding: theme.spacing[3],
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.background.secondary,
    alignItems: "center",
  },
  lengthOptionActive: {
    borderColor: theme.colors.accent.primary,
    backgroundColor: theme.colors.accent.primary + "20",
  },
  lengthOptionText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  lengthOptionTextActive: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  helperText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    textAlign: "center",
    fontStyle: "italic",
  },
  generateButton: {
    marginTop: theme.spacing[4],
  },
  reviewGate: {
    gap: theme.spacing[6],
  },
  reviewTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    textAlign: "center",
  },
  previewSection: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.md,
    padding: theme.spacing[4],
  },
  previewLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[3],
  },
  previewAffirmation: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  previewMore: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    fontStyle: "italic",
    marginTop: theme.spacing[2],
  },
  editLink: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.accent.primary,
    marginTop: theme.spacing[2],
  },
  audioSummary: {
    gap: theme.spacing[2],
  },
  audioChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.md,
    padding: theme.spacing[3],
    gap: theme.spacing[2],
  },
  audioChipLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
  },
  audioChipValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    flex: 1,
  },
  changeLink: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.accent.primary,
  },
  startButton: {
    marginTop: theme.spacing[4],
  },
});

