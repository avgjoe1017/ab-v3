import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AppScreen, PrimaryButton, ScienceCard } from "../components";
import { theme } from "../theme/tokens";
import { getScienceCardsByCategory } from "../lib/science";
import { useMemo } from "react";

interface ValuesEducationScreenProps {
  onNext: () => void;
  onSkip: () => void;
}

export default function ValuesEducationScreen({ onNext, onSkip }: ValuesEducationScreenProps) {
  // Get a science card about values-based affirmations
  const scienceCard = useMemo(() => {
    const valuesCards = getScienceCardsByCategory("affirmations");
    // Prefer the "values-based" card if available
    const valuesBasedCard = valuesCards.find((card) => card.id === "values-based");
    return valuesBasedCard || valuesCards[0] || null;
  }, []);

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialIcons name="favorite" size={64} color={theme.colors.accent.primary} />
          <Text style={styles.title}>Why Values Matter</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            Values-based affirmations work better because they connect to your identity, not just wishful thinking.
          </Text>

          <View style={styles.benefit}>
            <MaterialIcons name="check-circle" size={24} color={theme.colors.accent.primary} />
            <Text style={styles.benefitText}>
              More meaningful and believable affirmations
            </Text>
          </View>

          <View style={styles.benefit}>
            <MaterialIcons name="check-circle" size={24} color={theme.colors.accent.primary} />
            <Text style={styles.benefitText}>
              Personalized to what truly matters to you
            </Text>
          </View>

          <View style={styles.benefit}>
            <MaterialIcons name="check-circle" size={24} color={theme.colors.accent.primary} />
            <Text style={styles.benefitText}>
              Builds genuine self-belief over time
            </Text>
          </View>

          <Text style={styles.note}>
            We'll help you identify 3-5 core values that guide your life. This takes just a minute and makes your affirmations much more powerful.
          </Text>

          {/* Brief Science Card */}
          {scienceCard && (
            <View style={styles.scienceCardContainer}>
              <ScienceCard data={scienceCard} variant="compact" showIcon={false} />
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="Continue" onPress={onNext} variant="gradient" size="lg" />
          <Pressable onPress={onSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
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
    alignItems: "center",
    marginTop: theme.spacing[12],
    marginBottom: theme.spacing[8],
  },
  title: {
    ...theme.typography.styles.h1,
    fontSize: theme.typography.fontSize["3xl"],
    color: theme.colors.text.primary,
    marginTop: theme.spacing[4],
    textAlign: "center",
  },
  content: {
    flex: 1,
    marginBottom: theme.spacing[8],
  },
  description: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.relaxed,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[8],
    textAlign: "center",
  },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[4],
    paddingHorizontal: theme.spacing[4],
  },
  benefitText: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.normal,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing[4],
    flex: 1,
  },
  note: {
    ...theme.typography.styles.caption,
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.lineHeight.normal,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing[8],
    textAlign: "center",
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
  scienceCardContainer: {
    marginTop: theme.spacing[6],
    paddingHorizontal: theme.spacing[2],
  },
});

