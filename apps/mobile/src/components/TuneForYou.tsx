import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../theme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "../lib/api";
import { useAuthToken } from "../lib/auth";

interface TuneForYouProps {
  onComplete?: () => void;
}

export function TuneForYou({ onComplete }: TuneForYouProps) {
  const authToken = useAuthToken();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [primaryGoal, setPrimaryGoal] = useState<"Calm" | "Focus" | "Sleep" | "Confidence" | "Reset" | null>(null);
  const [voicePreference, setVoicePreference] = useState<"More space" | "Balanced" | "More guidance" | null>(null);
  const [soundPreference, setSoundPreference] = useState<"Voice-forward" | "Balanced" | "Atmosphere-forward" | null>(null);

  const { data: existingPrefs } = useQuery({
    queryKey: ["curation-preferences"],
    queryFn: async () => {
      const res = await apiGet<{ preferences: any }>("/me/curation/preferences", authToken);
      return res.preferences;
    },
    enabled: !!authToken && isOpen,
  });

  const saveMutation = useMutation({
    mutationFn: async (prefs: {
      primaryGoal?: string;
      voicePreference?: string;
      soundPreference?: string;
    }) => {
      return apiPost("/me/curation/preferences", prefs, authToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curation-cards"] });
      queryClient.invalidateQueries({ queryKey: ["curation-preferences"] });
      setIsOpen(false);
      if (onComplete) onComplete();
    },
  });

  const handleSave = () => {
    if (!primaryGoal || !voicePreference || !soundPreference) return;

    saveMutation.mutate({
      primaryGoal,
      voicePreference,
      soundPreference,
    });
  };

  const allSelected = primaryGoal && voicePreference && soundPreference;

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setIsOpen(true)}>
        <View style={styles.triggerContent}>
          <Text style={styles.triggerTitle}>TUNE YOUR FOR YOU</Text>
          <Text style={styles.triggerSubtitle}>Answer 3 quick taps. Better sessions, less fiddling.</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={theme.colors.text.tertiary} />
      </Pressable>

      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tune Your For You</Text>
              <Pressable onPress={() => setIsOpen(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.text.primary} />
              </Pressable>
            </View>

            <View style={styles.questionSection}>
              <Text style={styles.questionLabel}>Primary goal right now:</Text>
              <View style={styles.optionsRow}>
                {(["Calm", "Focus", "Sleep", "Confidence", "Reset"] as const).map((goal) => (
                  <Pressable
                    key={goal}
                    style={[styles.optionChip, primaryGoal === goal && styles.optionChipActive]}
                    onPress={() => setPrimaryGoal(goal)}
                  >
                    <Text style={[styles.optionText, primaryGoal === goal && styles.optionTextActive]}>
                      {goal}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.questionSection}>
              <Text style={styles.questionLabel}>Voice preference:</Text>
              <View style={styles.optionsRow}>
                {(["More space", "Balanced", "More guidance"] as const).map((voice) => (
                  <Pressable
                    key={voice}
                    style={[styles.optionChip, voicePreference === voice && styles.optionChipActive]}
                    onPress={() => setVoicePreference(voice)}
                  >
                    <Text style={[styles.optionText, voicePreference === voice && styles.optionTextActive]}>
                      {voice}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.questionSection}>
              <Text style={styles.questionLabel}>Sound preference:</Text>
              <View style={styles.optionsRow}>
                {(["Voice-forward", "Balanced", "Atmosphere-forward"] as const).map((sound) => (
                  <Pressable
                    key={sound}
                    style={[styles.optionChip, soundPreference === sound && styles.optionChipActive]}
                    onPress={() => setSoundPreference(sound)}
                  >
                    <Text style={[styles.optionText, soundPreference === sound && styles.optionTextActive]}>
                      {sound}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              style={[styles.saveButton, !allSelected && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!allSelected || saveMutation.isPending}
            >
              <Text style={[styles.saveButtonText, !allSelected && styles.saveButtonTextDisabled]}>
                {saveMutation.isPending ? "SAVING..." : "SAVE"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[4],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  triggerContent: {
    flex: 1,
  },
  triggerTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 12,
    color: theme.colors.text.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: theme.spacing[1],
  },
  triggerSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.background.surface,
    borderTopLeftRadius: theme.radius["2xl"],
    borderTopRightRadius: theme.radius["2xl"],
    padding: theme.spacing[6],
    paddingBottom: theme.spacing[8],
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing[6],
  },
  modalTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 20,
    color: theme.colors.text.primary,
  },
  questionSection: {
    marginBottom: theme.spacing[6],
  },
  questionLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[3],
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[2],
  },
  optionChip: {
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionChipActive: {
    backgroundColor: theme.colors.accent.primary + "15",
    borderColor: theme.colors.accent.primary,
  },
  optionText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  optionTextActive: {
    color: theme.colors.accent.primary,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: theme.colors.accent.primary,
    paddingVertical: theme.spacing[4],
    borderRadius: theme.radius.full,
    alignItems: "center",
    marginTop: theme.spacing[4],
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 15,
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  saveButtonTextDisabled: {
    color: theme.colors.text.tertiary,
  },
});

