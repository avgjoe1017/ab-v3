/**
 * AI Affirmation Screen
 * Router component that switches between Quick Generate and Guided flows
 * Uses lazy loading to only load the selected flow when needed
 */

import React, { useState, Suspense } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { AppScreen } from "../components";
import { theme } from "../theme";

// Lazy load flows for better performance - only load when user selects that path
// Note: React.lazy requires default exports, so we wrap the named exports
const QuickGenerateFlow = React.lazy(() => 
  import("./AIAffirmation/QuickGenerateFlow").then(module => ({ 
    default: module.QuickGenerateFlow 
  }))
);
const GuidedFlow = React.lazy(() => 
  import("./AIAffirmation/GuidedFlow").then(module => ({ 
    default: module.GuidedFlow 
  }))
);

type Path = "quick" | "guided";

// Loading fallback component for lazy-loaded flows
function LoadingFallback() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.accent.primary} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

export default function AIAffirmationScreen({ navigation }: any) {
  const [path, setPath] = useState<Path>("quick");

  return (
    <AppScreen>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Path Switch */}
        <View style={styles.pathSwitch}>
          <Pressable
            style={[styles.pathButton, path === "quick" && styles.pathButtonActive]}
            onPress={() => setPath("quick")}
          >
            <Text style={[styles.pathButtonText, path === "quick" && styles.pathButtonTextActive]}>
              QUICK GENERATE
            </Text>
          </Pressable>
          <Pressable
            style={[styles.pathButton, path === "guided" && styles.pathButtonActive]}
            onPress={() => setPath("guided")}
          >
            <Text style={[styles.pathButtonText, path === "guided" && styles.pathButtonTextActive]}>
              GUIDED
            </Text>
          </Pressable>
        </View>

        <Text style={styles.reassurance}>You can edit anything before you start.</Text>

        {/* Quick Generate Path - Lazy Loaded */}
        {path === "quick" && (
          <View style={styles.pathContent}>
            <Suspense fallback={<LoadingFallback />}>
              <QuickGenerateFlow navigation={navigation} />
            </Suspense>
          </View>
        )}

        {/* Guided Path - Lazy Loaded */}
        {path === "guided" && (
          <View style={styles.pathContent}>
            <Suspense fallback={<LoadingFallback />}>
              <GuidedFlow navigation={navigation} />
            </Suspense>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing[6],
  },
  pathSwitch: {
    flexDirection: "row",
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[1],
    marginBottom: theme.spacing[3],
  },
  pathButton: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    alignItems: "center",
    borderRadius: theme.radius.md,
  },
  pathButtonActive: {
    backgroundColor: theme.colors.accent.primary,
  },
  pathButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.muted,
  },
  pathButtonTextActive: {
    color: theme.colors.text.primary,
  },
  reassurance: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    textAlign: "center",
    marginBottom: theme.spacing[6],
  },
  pathContent: {
    gap: theme.spacing[6],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing[8],
    minHeight: 200,
  },
  loadingText: {
    marginTop: theme.spacing[3],
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
  },
});
