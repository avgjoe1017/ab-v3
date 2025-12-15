import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AppScreen, PrimaryButton } from "../components";
import { theme } from "../theme/tokens";

interface StruggleInputScreenProps {
  onNext: (struggle?: string) => void;
  onBack: () => void;
  onSkip: () => void;
}

export default function StruggleInputScreen({ onNext, onBack, onSkip }: StruggleInputScreenProps) {
  const [struggle, setStruggle] = useState("");

  const handleContinue = () => {
    onNext(struggle.trim() || undefined);
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </Pressable>
          <Text style={styles.title}>What are you working on?</Text>
          <Text style={styles.subtitle}>
            This helps us create more targeted affirmations. You can skip this step.
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g., I'm dealing with imposter syndrome at work"
              placeholderTextColor={theme.colors.text.tertiary}
              value={struggle}
              onChangeText={setStruggle}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={200}
            />
            <Text style={styles.charCount}>
              {struggle.length}/200
            </Text>
          </View>

          <View style={styles.examples}>
            <Text style={styles.examplesTitle}>Examples:</Text>
            <Pressable onPress={() => setStruggle("I'm dealing with imposter syndrome at work")} style={styles.example}>
              <Text style={styles.exampleText}>I'm dealing with imposter syndrome at work</Text>
            </Pressable>
            <Pressable onPress={() => setStruggle("I want to be more present with my family")} style={styles.example}>
              <Text style={styles.exampleText}>I want to be more present with my family</Text>
            </Pressable>
            <Pressable onPress={() => setStruggle("I'm training for a marathon")} style={styles.example}>
              <Text style={styles.exampleText}>I'm training for a marathon</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label="Continue"
            onPress={handleContinue}
            variant="gradient"
            size="lg"
          />
          <Pressable onPress={onSkip}>
            <Text style={styles.skipText}>Skip this step</Text>
          </Pressable>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: theme.spacing[6],
    paddingBottom: 100,
  },
  header: {
    marginBottom: theme.spacing[8],
    paddingTop: theme.spacing[4],
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: theme.spacing[4],
    padding: theme.spacing[2],
  },
  title: {
    ...theme.typography.styles.h1,
    fontSize: theme.typography.fontSize["3xl"],
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal,
  },
  content: {
    flex: 1,
    marginBottom: theme.spacing[8],
  },
  inputContainer: {
    marginBottom: theme.spacing[6],
  },
  input: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing[4],
    minHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    marginBottom: theme.spacing[2],
  },
  charCount: {
    ...theme.typography.styles.caption,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: "right",
  },
  examples: {
    gap: theme.spacing[2],
  },
  examplesTitle: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
    fontWeight: theme.typography.fontWeight.medium,
  },
  example: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing[3],
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  exampleText: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontStyle: "italic",
  },
  actions: {
    gap: theme.spacing[4],
    alignItems: "center",
  },
  skipText: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: "center",
    paddingVertical: theme.spacing[4],
  },
});

