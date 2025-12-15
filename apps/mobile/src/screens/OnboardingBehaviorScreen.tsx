import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AppScreen, PrimaryButton, Card } from "../components";
import { theme } from "../theme";
import type { DefaultBehavior } from "../storage/onboarding";

interface OnboardingBehaviorScreenProps {
  onComplete: (behavior?: DefaultBehavior) => void;
  onSkip: () => void;
}

const BEHAVIORS: Array<{
  id: DefaultBehavior;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}> = [
  {
    id: "quick-start",
    title: "Quick Start",
    description: "Start a recommended session immediately",
    icon: "flash-on",
  },
  {
    id: "choose-each-time",
    title: "Choose Each Time",
    description: "Browse and pick a session every time",
    icon: "explore",
  },
];

export default function OnboardingBehaviorScreen({ onComplete, onSkip }: OnboardingBehaviorScreenProps) {
  const [selectedBehavior, setSelectedBehavior] = useState<DefaultBehavior | null>(null);

  return (
    <AppScreen>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>How would you like to start?</Text>
          <Text style={styles.subtitle}>
            You can change this anytime in settings
          </Text>
        </View>

        {/* Behaviors List */}
        <View style={styles.behaviorsList}>
          {BEHAVIORS.map((behavior) => {
            const isSelected = selectedBehavior === behavior.id;
            return (
              <Pressable
                key={behavior.id}
                onPress={() => setSelectedBehavior(behavior.id)}
                style={styles.behaviorPressable}
              >
                <Card
                  variant={isSelected ? "elevated" : "default"}
                  style={StyleSheet.flatten([
                    styles.behaviorCard,
                    isSelected && { borderColor: theme.colors.accent.primary, borderWidth: 2 },
                  ]) as ViewStyle}
                >
                  <MaterialIcons
                    name={behavior.icon}
                    size={32}
                    color={isSelected ? theme.colors.accent.primary : theme.colors.text.secondary}
                  />
                  <View style={styles.behaviorContent}>
                    <Text style={styles.behaviorTitle}>{behavior.title}</Text>
                    <Text style={styles.behaviorDescription}>{behavior.description}</Text>
                  </View>
                  {isSelected && (
                    <MaterialIcons name="check-circle" size={24} color={theme.colors.accent.primary} />
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
            label="Complete"
            onPress={() => onComplete(selectedBehavior || undefined)}
            variant="gradient"
            size="lg"
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
  behaviorsList: {
    paddingHorizontal: theme.spacing[6],
    gap: theme.spacing[4],
    paddingBottom: theme.spacing[6],
  },
  behaviorPressable: {
    width: "100%",
  },
  behaviorCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing[4],
    padding: theme.spacing[4],
  },
  behaviorContent: {
    flex: 1,
    gap: theme.spacing[1],
  },
  behaviorTitle: {
    ...theme.typography.styles.h3,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  behaviorDescription: {
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

