/**
 * Guided Flow Component
 * Handles the guided path: goal input + audio settings → generation → review/edit → start
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Alert, Pressable } from "react-native";
import { useAuthToken } from "../../lib/auth";
import { getUserStruggle } from "../../lib/values";
import { apiPost } from "../../lib/api";
import type { SessionV3 } from "@ab/contracts";
import { PrimaryButton, Chip } from "../../components";
import { theme } from "../../theme";
import type { AffirmationStyle, AudioSettings } from "../../lib/affirmationPack";
import { decideAudioSettings, packToSessionPayload } from "../../lib/affirmationPack";
import { AudioSettingsPanel } from "./AudioSettingsPanel";
import { ReviewEditStep } from "./ReviewEditStep";

type GuidedStep = "goal" | "review";

interface GuidedFlowProps {
  navigation: any;
}

export function GuidedFlow({ navigation }: GuidedFlowProps) {
  const authToken = useAuthToken();
  const [guidedStep, setGuidedStep] = useState<GuidedStep>("goal");
  const [guidedGoal, setGuidedGoal] = useState("");
  const [guidedContext, setGuidedContext] = useState("");
  const [guidedStyle, setGuidedStyle] = useState<AffirmationStyle>("balanced");
  const [guidedLength, setGuidedLength] = useState<6 | 12 | 18 | 24>(12);
  const [guidedAffirmations, setGuidedAffirmations] = useState<string[]>([]);
  const [isGuidedGenerating, setIsGuidedGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [deletedIndices, setDeletedIndices] = useState<Set<number>>(new Set());
  
  // Initialize audio settings with defaults from the start
  const [guidedAudioSettings, setGuidedAudioSettings] = useState<AudioSettings>(() => 
    decideAudioSettings("")
  );

  const handleGuidedGenerate = async () => {
    if (!guidedGoal.trim() || guidedGoal.length < 2 || guidedGoal.length > 140) {
      Alert.alert("Invalid Goal", "Goal must be 2-140 characters.");
      return;
    }

    try {
      setIsGuidedGenerating(true);

      // Fetch user struggle
      let userStruggle: string | undefined;

      try {
        const struggleResponse = await getUserStruggle(authToken);
        userStruggle = struggleResponse.struggle || undefined;
      } catch (err) {
        console.log("[AIAffirmation] Could not fetch user struggle");
      }

      // Build session type from goal
      const goalLower = guidedGoal.toLowerCase();
      let sessionType = "Meditate";
      if (goalLower.includes("focus") || goalLower.includes("work")) {
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
          struggle: userStruggle || (guidedContext || undefined),
          goal: guidedGoal,
          count: guidedLength,
        },
        authToken
      );

      setGuidedAffirmations(response.affirmations);
      setIsGuidedGenerating(false);
      setGuidedStep("review");
    } catch (error) {
      console.error("[AIAffirmation] Failed to generate:", error);
      Alert.alert(
        "Generation Failed",
        error instanceof Error ? error.message : "Could not generate affirmations. Please try again."
      );
      setIsGuidedGenerating(false);
    }
  };

  const handleRegenerateDeleted = async () => {
    const deletedCount = deletedIndices.size;
    if (deletedCount === 0) {
      Alert.alert("No Deleted Items", "No affirmations have been deleted to regenerate.");
      return;
    }

    try {
      setIsRegenerating(true);
      // Regenerate only deleted count
      const goalLower = guidedGoal.toLowerCase();
      let sessionType = "Meditate";
      if (goalLower.includes("focus") || goalLower.includes("work")) {
        sessionType = "Focus";
      } else if (goalLower.includes("sleep")) {
        sessionType = "Sleep";
      } else if (goalLower.includes("anxiety")) {
        sessionType = "Anxiety Relief";
      }

      const response = await apiPost<{ affirmations: string[] }>(
        "/affirmations/generate",
        {
          sessionType,
          struggle: guidedContext || undefined,
          goal: guidedGoal,
          count: deletedCount,
        },
        authToken
      );

      // Replace deleted affirmations with regenerated ones
      const updated = [...guidedAffirmations];
      let regenIndex = 0;
      deletedIndices.forEach((deletedIndex) => {
        if (regenIndex < response.affirmations.length) {
          const newAff = response.affirmations[regenIndex];
          if (newAff) {
            updated[deletedIndex] = newAff;
            regenIndex++;
          }
        }
      });
      setGuidedAffirmations(updated);
      setDeletedIndices(new Set());
      setIsRegenerating(false);
    } catch (error) {
      console.error("[AIAffirmation] Regenerate failed:", error);
      Alert.alert("Regeneration Failed", "Could not regenerate affirmations. Please try again.");
      setIsRegenerating(false);
    }
  };

  const handleRegenerateAll = async () => {
    try {
      setIsRegenerating(true);
      const goalLower = guidedGoal.toLowerCase();
      let sessionType = "Meditate";
      if (goalLower.includes("focus") || goalLower.includes("work")) {
        sessionType = "Focus";
      } else if (goalLower.includes("sleep")) {
        sessionType = "Sleep";
      } else if (goalLower.includes("anxiety")) {
        sessionType = "Anxiety Relief";
      }

      const response = await apiPost<{ affirmations: string[] }>(
        "/affirmations/generate",
        {
          sessionType,
          struggle: guidedContext || undefined,
          goal: guidedGoal,
          count: guidedLength,
        },
        authToken
      );

      setGuidedAffirmations(response.affirmations);
      setDeletedIndices(new Set());
      setIsRegenerating(false);
    } catch (error) {
      console.error("[AIAffirmation] Regenerate all failed:", error);
      Alert.alert("Regeneration Failed", "Could not regenerate affirmations. Please try again.");
      setIsRegenerating(false);
    }
  };

  const handleGuidedStart = async () => {
    if (guidedAffirmations.length === 0 || !guidedAudioSettings) return;

    try {
      const payload = packToSessionPayload({
        goal: guidedGoal,
        context: guidedContext || undefined,
        affirmations: guidedAffirmations,
        style: guidedStyle,
        length: guidedLength,
        audioSettings: guidedAudioSettings,
      });

      const res = await apiPost<SessionV3>("/sessions", payload, authToken);
      navigation.navigate("Player", { sessionId: res.id });
    } catch (error) {
      console.error("[AIAffirmation] Failed to create session:", error);
      Alert.alert("Failed to Start", "Could not create session. Please try again.");
    }
  };

  if (guidedStep === "review") {
    return (
      <>
        <ReviewEditStep
          affirmations={guidedAffirmations}
          onAffirmationsChange={setGuidedAffirmations}
          onStart={handleGuidedStart}
          startButtonLabel="Start Session"
          startButtonDisabled={!guidedAudioSettings}
          onDeletedIndicesChange={setDeletedIndices}
        />
        
        {/* Regenerate options */}
        <View style={styles.regenerateSection}>
          <Text style={styles.label}>Regenerate</Text>
          <View style={styles.regenerateButtons}>
            <Pressable
              onPress={handleRegenerateDeleted}
              disabled={isRegenerating || deletedIndices.size === 0}
              style={[styles.regenerateButton, (isRegenerating || deletedIndices.size === 0) && styles.regenerateButtonDisabled]}
            >
              <Text style={[styles.regenerateButtonText, (isRegenerating || deletedIndices.size === 0) && styles.regenerateButtonTextDisabled]}>
                {isRegenerating ? "Regenerating..." : "Deleted only"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleRegenerateAll}
              disabled={isRegenerating}
              style={[styles.regenerateButton, isRegenerating && styles.regenerateButtonDisabled]}
            >
              <Text style={[styles.regenerateButtonText, isRegenerating && styles.regenerateButtonTextDisabled]}>
                All
              </Text>
            </Pressable>
          </View>
        </View>
      </>
    );
  }

  // Goal step
  return (
    <>
      <View style={styles.section}>
        <Text style={styles.label}>Goal</Text>
        <TextInput
          style={styles.input}
          value={guidedGoal}
          onChangeText={setGuidedGoal}
          placeholder="What do you want to work on today?"
          multiline
          maxLength={140}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{guidedGoal.length}/140</Text>

        <TextInput
          style={[styles.input, styles.contextInput]}
          value={guidedContext}
          onChangeText={setGuidedContext}
          placeholder="Optional: Add context..."
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Style</Text>
        <View style={styles.styleChips}>
          {(["balanced", "grounded", "confident", "gentle", "focus"] as AffirmationStyle[]).map((style) => (
            <Chip
              key={style}
              label={style.charAt(0).toUpperCase() + style.slice(1)}
              active={guidedStyle === style}
              onPress={() => setGuidedStyle(style)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Number of Affirmations</Text>
        <View style={styles.lengthOptions}>
          {([6, 12, 18, 24] as const).map((len) => (
            <Pressable
              key={len}
              style={[styles.lengthOption, guidedLength === len && styles.lengthOptionActive]}
              onPress={() => setGuidedLength(len)}
            >
              <Text style={[styles.lengthOptionText, guidedLength === len && styles.lengthOptionTextActive]}>
                {len}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Audio Setup */}
      <AudioSettingsPanel
        audioSettings={guidedAudioSettings}
        onAudioSettingsChange={setGuidedAudioSettings}
      />

      <PrimaryButton
        label={isGuidedGenerating ? "Generating..." : "Generate"}
        onPress={handleGuidedGenerate}
        disabled={isGuidedGenerating || !guidedGoal.trim()}
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
  styleChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[2],
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
  generateButton: {
    marginTop: theme.spacing[4],
  },
  regenerateSection: {
    marginBottom: theme.spacing[4],
    marginTop: theme.spacing[4],
  },
  regenerateButtons: {
    flexDirection: "row",
    gap: theme.spacing[2],
    marginTop: theme.spacing[2],
  },
  regenerateButton: {
    flex: 1,
    padding: theme.spacing[3],
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.background.secondary,
    alignItems: "center",
  },
  regenerateButtonDisabled: {
    opacity: 0.5,
  },
  regenerateButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  regenerateButtonTextDisabled: {
    color: theme.colors.text.muted,
  },
});

