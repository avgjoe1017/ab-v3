import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AppScreen, PrimaryButton, DuotoneCard, type DuotonePalette } from "../components";
import { theme } from "../theme";
import type { OnboardingVoice } from "../storage/onboarding";

interface OnboardingVoiceScreenProps {
  onNext: (voice: OnboardingVoice) => void;
  onSkip: () => void;
  selectedGoal?: string;
}

const VOICES: Array<{
  id: OnboardingVoice;
  name: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  palette: DuotonePalette;
}> = [
  {
    id: "shimmer",
    name: "Shimmer",
    description: "Warm and gentle",
    icon: "record-voice-over",
    palette: "lavender",
  },
  {
    id: "onyx",
    name: "Onyx",
    description: "Deep and calming",
    icon: "record-voice-over",
    palette: "twilight",
  },
  {
    id: "nova",
    name: "Nova",
    description: "Bright and clear",
    icon: "record-voice-over",
    palette: "honey",
  },
  {
    id: "echo",
    name: "Echo",
    description: "Soft and soothing",
    icon: "record-voice-over",
    palette: "sage",
  },
];

export default function OnboardingVoiceScreen({ onNext, onSkip }: OnboardingVoiceScreenProps) {
  const [selectedVoice, setSelectedVoice] = useState<OnboardingVoice | null>(null);
  const [playingVoice, setPlayingVoice] = useState<OnboardingVoice | null>(null);

  const handlePlaySample = (voiceId: OnboardingVoice) => {
    // TODO: Play voice sample
    setPlayingVoice(voiceId);
    setTimeout(() => setPlayingVoice(null), 2000); // Stop after 2 seconds
  };

  return (
    <AppScreen>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose your voice</Text>
          <Text style={styles.subtitle}>
            Pick the voice that feels most comfortable to you
          </Text>
        </View>

        {/* Voices Grid */}
        <View style={styles.voicesGrid}>
          {VOICES.map((voice) => {
            const isSelected = selectedVoice === voice.id;
            const isPlaying = playingVoice === voice.id;
            return (
              <View key={voice.id} style={styles.voiceWrapper}>
                <DuotoneCard
                  title={voice.name}
                  subtitle={voice.description}
                  icon={voice.icon}
                  palette={voice.palette}
                  height={120}
                  onPress={() => setSelectedVoice(voice.id)}
                  style={isSelected ? styles.voiceSelected : undefined}
                >
                  <View style={styles.voiceCardContent}>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handlePlaySample(voice.id);
                      }}
                      style={styles.voicePlayButton}
                    >
                      <MaterialIcons
                        name={isPlaying ? "pause" : "play-arrow"}
                        size={20}
                        color="#ffffff"
                      />
                    </Pressable>
                    <View style={styles.voiceCardInfo}>
                      <Text style={styles.voiceCardName}>{voice.name}</Text>
                      <Text style={styles.voiceCardDescription}>{voice.description}</Text>
                    </View>
                    {isSelected && (
                      <MaterialIcons name="check-circle" size={22} color="#ffffff" />
                    )}
                  </View>
                </DuotoneCard>
              </View>
            );
          })}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable onPress={onSkip} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </Pressable>
          <PrimaryButton
            label="Continue"
            onPress={() => selectedVoice && onNext(selectedVoice)}
            variant="gradient"
            size="lg"
            disabled={!selectedVoice}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    padding: theme.spacing[6],
    paddingTop: theme.spacing[12],
    gap: theme.spacing[2],
    alignItems: "center",
  },
  title: {
    ...theme.typography.styles.h1,
    fontSize: theme.typography.fontSize["3xl"],
    color: theme.colors.text.primary,
    textAlign: "center",
  },
  subtitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: theme.typography.lineHeight.relaxed,
  },
  voicesGrid: {
    paddingHorizontal: theme.spacing[6],
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[3],
    paddingBottom: theme.spacing[6],
  },
  voiceWrapper: {
    width: "48%",
    minWidth: 150,
  },
  voiceSelected: {
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  voiceCardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.spacing[3],
  },
  voicePlayButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceCardInfo: {
    flex: 1,
    gap: theme.spacing[0],
  },
  voiceCardName: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.fontSize.md,
    fontWeight: "600",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  voiceCardDescription: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: "rgba(255, 255, 255, 0.85)",
  },
  actions: {
    paddingHorizontal: theme.spacing[6],
    gap: theme.spacing[4],
  },
  skipButton: {
    paddingVertical: theme.spacing[3],
    alignItems: "center",
  },
  skipButtonText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.tertiary,
  },
});

