import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AppScreen, PrimaryButton, DuotoneCard, type DuotonePalette } from "../components";
import { theme } from "../theme";
import type { OnboardingGoal } from "../storage/onboarding";

interface OnboardingGoalScreenProps {
  onNext: (goal: OnboardingGoal) => void;
  onSkip: () => void;
}

const GOALS: Array<{
  id: OnboardingGoal;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  palette: DuotonePalette;
}> = [
  {
    id: "sleep",
    title: "Sleep",
    description: "Rest deeply and wake refreshed",
    icon: "bedtime",
    palette: "twilight",
  },
  {
    id: "focus",
    title: "Focus",
    description: "Sharpen your concentration",
    icon: "psychology",
    palette: "lavender",
  },
  {
    id: "calm",
    title: "Calm",
    description: "Find peace in the moment",
    icon: "self-improvement",
    palette: "sage",
  },
  {
    id: "confidence",
    title: "Confidence",
    description: "Build unshakeable self-belief",
    icon: "bolt",
    palette: "honey",
  },
];

export default function OnboardingGoalScreen({ onNext, onSkip }: OnboardingGoalScreenProps) {
  const [selectedGoal, setSelectedGoal] = useState<OnboardingGoal | null>(null);

  return (
    <AppScreen>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>What's your primary goal?</Text>
          <Text style={styles.subtitle}>
            We'll personalize your experience based on what you need most
          </Text>
        </View>

        {/* Goals Grid */}
        <View style={styles.goalsGrid}>
          {GOALS.map((goal) => {
            const isSelected = selectedGoal === goal.id;
            return (
              <View key={goal.id} style={styles.goalWrapper}>
                <DuotoneCard
                  title={goal.title}
                  subtitle={goal.description}
                  icon={goal.icon}
                  palette={goal.palette}
                  height={130}
                  onPress={() => setSelectedGoal(goal.id)}
                  style={isSelected ? styles.goalSelected : undefined}
                >
                  <View style={styles.goalCardContent}>
                    <View style={styles.goalCardInfo}>
                      <Text style={styles.goalCardTitle}>{goal.title}</Text>
                      <Text style={styles.goalCardDescription}>{goal.description}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.goalCheck}>
                        <MaterialIcons name="check-circle" size={24} color="#ffffff" />
                      </View>
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
            onPress={() => selectedGoal && onNext(selectedGoal)}
            variant="gradient"
            size="lg"
            disabled={!selectedGoal}
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
  goalsGrid: {
    paddingHorizontal: theme.spacing[6],
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[3],
    paddingBottom: theme.spacing[6],
  },
  goalWrapper: {
    width: "48%",
    minWidth: 150,
  },
  goalSelected: {
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  goalCardContent: {
    flex: 1,
    justifyContent: "flex-end",
  },
  goalCardInfo: {
    gap: theme.spacing[1],
  },
  goalCardTitle: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  goalCardDescription: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 16,
  },
  goalCheck: {
    position: "absolute",
    top: 0,
    right: 0,
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

