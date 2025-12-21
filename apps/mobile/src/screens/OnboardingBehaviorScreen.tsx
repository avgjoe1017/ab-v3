import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AppScreen, PrimaryButton, DuotoneCard, type DuotonePalette } from "../components";
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
  palette: DuotonePalette;
}> = [
  {
    id: "quick-start",
    title: "Quick Start",
    description: "Start a recommended session immediately",
    icon: "flash-on",
    palette: "honey",
  },
  {
    id: "choose-each-time",
    title: "Choose Each Time",
    description: "Browse and pick a session every time",
    icon: "explore",
    palette: "lavender",
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
              <View key={behavior.id} style={styles.behaviorWrapper}>
                <DuotoneCard
                  title={behavior.title}
                  subtitle={behavior.description}
                  icon={behavior.icon}
                  palette={behavior.palette}
                  height={140}
                  onPress={() => setSelectedBehavior(behavior.id)}
                  style={isSelected ? styles.behaviorSelected : undefined}
                >
                  <View style={styles.behaviorCardContent}>
                    <View style={styles.behaviorCardInfo}>
                      <Text style={styles.behaviorCardTitle}>{behavior.title}</Text>
                      <Text style={styles.behaviorCardDescription}>{behavior.description}</Text>
                    </View>
                    {isSelected && (
                      <MaterialIcons name="check-circle" size={24} color="#ffffff" />
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
    gap: theme.spacing[3],
    paddingBottom: theme.spacing[6],
  },
  behaviorWrapper: {
    width: "100%",
  },
  behaviorSelected: {
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  behaviorCardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  behaviorCardInfo: {
    flex: 1,
    gap: theme.spacing[1],
  },
  behaviorCardTitle: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  behaviorCardDescription: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 18,
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

