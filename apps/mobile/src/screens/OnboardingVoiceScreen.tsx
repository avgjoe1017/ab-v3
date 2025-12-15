import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AppScreen, PrimaryButton, Card } from "../components";
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
  color: string;
}> = [
  {
    id: "shimmer",
    name: "Shimmer",
    description: "Warm and gentle",
    icon: "record-voice-over",
    color: "#a855f7",
  },
  {
    id: "onyx",
    name: "Onyx",
    description: "Deep and calming",
    icon: "record-voice-over",
    color: "#6366f1",
  },
  {
    id: "nova",
    name: "Nova",
    description: "Bright and clear",
    icon: "record-voice-over",
    color: "#f97316",
  },
  {
    id: "echo",
    name: "Echo",
    description: "Soft and soothing",
    icon: "record-voice-over",
    color: "#14b8a6",
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

        {/* Voices List */}
        <View style={styles.voicesList}>
          {VOICES.map((voice) => {
            const isSelected = selectedVoice === voice.id;
            const isPlaying = playingVoice === voice.id;
            return (
              <Pressable
                key={voice.id}
                onPress={() => setSelectedVoice(voice.id)}
                style={styles.voicePressable}
              >
                <Card
                  variant={isSelected ? "elevated" : "default"}
                  style={StyleSheet.flatten([
                    styles.voiceCard,
                    isSelected && { borderColor: voice.color, borderWidth: 2 },
                  ]) as ViewStyle}
                >
                  <View style={styles.voiceLeft}>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handlePlaySample(voice.id);
                      }}
                      style={[styles.playButton, { backgroundColor: `${voice.color}20` }]}
                    >
                      <MaterialIcons
                        name={isPlaying ? "pause" : "play-arrow"}
                        size={24}
                        color={voice.color}
                      />
                    </Pressable>
                    <View style={styles.voiceContent}>
                      <Text style={styles.voiceName}>{voice.name}</Text>
                      <Text style={styles.voiceDescription}>{voice.description}</Text>
                    </View>
                  </View>
                  {isSelected && (
                    <MaterialIcons name="check-circle" size={24} color={voice.color} />
                  )}
                </Card>
              </Pressable>
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
  voicesList: {
    paddingHorizontal: theme.spacing[6],
    gap: theme.spacing[3],
    paddingBottom: theme.spacing[6],
  },
  voicePressable: {
    width: "100%",
  },
  voiceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing[4],
  },
  voiceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[4],
    flex: 1,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceContent: {
    flex: 1,
    gap: theme.spacing[0],
  },
  voiceName: {
    ...theme.typography.styles.h3,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  voiceDescription: {
    ...theme.typography.styles.body,
    color: theme.colors.text.tertiary,
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

