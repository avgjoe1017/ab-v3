import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AppScreen, PrimaryButton, Card } from "../components";
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
  color: string;
}> = [
  {
    id: "sleep",
    title: "Sleep",
    description: "Rest deeply and wake refreshed",
    icon: "bedtime",
    color: "#3b82f6",
  },
  {
    id: "focus",
    title: "Focus",
    description: "Sharpen your concentration",
    icon: "psychology",
    color: "#a855f7",
  },
  {
    id: "calm",
    title: "Calm",
    description: "Find peace in the moment",
    icon: "self-improvement",
    color: "#14b8a6",
  },
  {
    id: "confidence",
    title: "Confidence",
    description: "Build unshakeable self-belief",
    icon: "bolt",
    color: "#f97316",
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
              <Pressable
                key={goal.id}
                onPress={() => setSelectedGoal(goal.id)}
                style={styles.goalPressable}
              >
                <Card
                  variant={isSelected ? "elevated" : "default"}
                  style={StyleSheet.flatten([
                    styles.goalCard,
                    isSelected && { borderColor: goal.color, borderWidth: 2 },
                  ]) as ViewStyle}
                >
                  <View style={[styles.goalIconContainer, { backgroundColor: `${goal.color}20` }]}>
                    <MaterialIcons name={goal.icon} size={32} color={goal.color} />
                  </View>
                  <View style={styles.goalContent}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <Text style={styles.goalDescription}>{goal.description}</Text>
                  </View>
                  {isSelected && (
                    <MaterialIcons name="check-circle" size={24} color={goal.color} />
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
    gap: theme.spacing[4],
    paddingBottom: theme.spacing[6],
  },
  goalPressable: {
    width: "100%",
  },
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[4],
    padding: theme.spacing[4],
  },
  goalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  goalContent: {
    flex: 1,
    gap: theme.spacing[1],
  },
  goalTitle: {
    ...theme.typography.styles.h3,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
  },
  goalDescription: {
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

