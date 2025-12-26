import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { AppScreen } from "../components";
import { theme } from "../theme";
import { Onboarding, type OnboardingStep } from "../components/bna-ui";
import { MaterialIcons } from "@expo/vector-icons";

/**
 * Example screen demonstrating Onboarding component
 */
export default function OnboardingExampleScreen({ navigation }: any) {
  const [showOnboarding, setShowOnboarding] = useState(true);

  const steps: OnboardingStep[] = [
    {
      id: "1",
      title: "Welcome",
      description: "Discover beautiful, animated components built with React Native and Expo.",
      icon: (
        <MaterialIcons name="auto-awesome" size={80} color={theme.colors.accent.primary} />
      ),
      backgroundColor: theme.colors.background.surface,
    },
    {
      id: "2",
      title: "Smooth Animations",
      description: "Every interaction is smooth and responsive, powered by react-native-reanimated.",
      icon: (
        <MaterialIcons name="animation" size={80} color={theme.colors.accent.primary} />
      ),
      backgroundColor: theme.colors.background.surfaceSubtle,
    },
    {
      id: "3",
      title: "Customizable",
      description: "Easily customize colors, spacing, and behavior to match your design system.",
      icon: (
        <MaterialIcons name="palette" size={80} color={theme.colors.accent.primary} />
      ),
      backgroundColor: theme.colors.background.surface,
    },
    {
      id: "4",
      title: "Ready to Use",
      description: "All components are production-ready and fully documented.",
      icon: (
        <MaterialIcons name="check-circle" size={80} color={theme.colors.accent.primary} />
      ),
      backgroundColor: theme.colors.background.surfaceSubtle,
    },
  ];

  if (showOnboarding) {
    return (
      <AppScreen>
        <Onboarding
          steps={steps}
          onComplete={() => {
            setShowOnboarding(false);
            console.log("Onboarding completed!");
          }}
          onSkip={() => {
            setShowOnboarding(false);
            console.log("Onboarding skipped!");
          }}
          showSkip
          showProgress
          swipeEnabled
          primaryButtonText="Get Started"
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <SafeAreaView style={styles.container}>
        <View style={styles.completedContainer}>
          <MaterialIcons name="check-circle" size={64} color={theme.colors.semantic.success} />
          <Text style={styles.completedTitle}>Onboarding Complete!</Text>
          <Text style={styles.completedText}>
            You've successfully completed the onboarding flow.
          </Text>
        </View>
      </SafeAreaView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  completedContainer: {
    alignItems: "center",
    padding: theme.spacing[6],
    gap: theme.spacing[4],
  },
  completedTitle: {
    ...theme.typography.styles.h1,
    textAlign: "center",
  },
  completedText: {
    ...theme.typography.styles.body,
    textAlign: "center",
    color: theme.colors.text.secondary,
  },
});

