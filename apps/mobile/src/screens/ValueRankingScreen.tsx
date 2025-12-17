import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AppScreen, PrimaryButton } from "../components";
import { theme } from "../theme/tokens";
import type { Value } from "./ValueSelectionScreen";

interface ValueRankingScreenProps {
  selectedValues: Value[];
  onNext: (rankedValues: Value[]) => void;
  onBack: () => void;
}

export default function ValueRankingScreen({ selectedValues, onNext, onBack }: ValueRankingScreenProps) {
  const [rankedValues, setRankedValues] = useState<Value[]>(selectedValues.slice(0, 3)); // Start with first 3
  const [unrankedValues, setUnrankedValues] = useState<Value[]>(selectedValues.slice(3)); // Rest are unranked

  const moveToRanked = (value: Value) => {
    if (rankedValues.length < 3) {
      setRankedValues([...rankedValues, value]);
      setUnrankedValues(unrankedValues.filter((v) => v.valueId !== value.valueId));
    }
  };

  const moveToUnranked = (value: Value) => {
    setRankedValues(rankedValues.filter((v) => v.valueId !== value.valueId));
    setUnrankedValues([...unrankedValues, value]);
  };

  const moveRank = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index > 0) {
      const newRanked = [...rankedValues];
      const current = newRanked[index];
      const previous = newRanked[index - 1];
      if (current && previous) {
        newRanked[index] = previous;
        newRanked[index - 1] = current;
        setRankedValues(newRanked);
      }
    } else if (direction === "down" && index < rankedValues.length - 1) {
      const newRanked = [...rankedValues];
      const current = newRanked[index];
      const next = newRanked[index + 1];
      if (current && next) {
        newRanked[index] = next;
        newRanked[index + 1] = current;
        setRankedValues(newRanked);
      }
    }
  };

  const allValues = [...rankedValues, ...unrankedValues];

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </Pressable>
          <Text style={styles.title}>Rank Your Top 3</Text>
          <Text style={styles.subtitle}>
            Drag to reorder your top 3 values. The rest will be saved but not ranked.
          </Text>
        </View>

        <View style={styles.rankedSection}>
          <Text style={styles.sectionTitle}>Top 3 Values</Text>
          {rankedValues.map((value, index) => (
            <View key={value.valueId} style={styles.rankedItem}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <Text style={styles.valueText}>{value.valueText}</Text>
              <View style={styles.rankControls}>
                {index > 0 && (
                  <Pressable onPress={() => moveRank(index, "up")} style={styles.rankButton}>
                    <MaterialIcons name="arrow-upward" size={20} color={theme.colors.accent.primary} />
                  </Pressable>
                )}
                {index < rankedValues.length - 1 && (
                  <Pressable onPress={() => moveRank(index, "down")} style={styles.rankButton}>
                    <MaterialIcons name="arrow-downward" size={20} color={theme.colors.accent.primary} />
                  </Pressable>
                )}
                <Pressable onPress={() => moveToUnranked(value)} style={styles.removeButton}>
                  <MaterialIcons name="close" size={20} color={theme.colors.text.secondary} />
                </Pressable>
              </View>
            </View>
          ))}
          {rankedValues.length < 3 && (
            <Text style={styles.hint}>Select {3 - rankedValues.length} more to complete your top 3</Text>
          )}
        </View>

        {unrankedValues.length > 0 && (
          <View style={styles.unrankedSection}>
            <Text style={styles.sectionTitle}>Other Values</Text>
            {unrankedValues.map((value) => (
              <Pressable
                key={value.valueId}
                onPress={() => moveToRanked(value)}
                style={styles.unrankedItem}
              >
                <Text style={styles.valueText}>{value.valueText}</Text>
                <MaterialIcons name="add" size={24} color={theme.colors.accent.primary} />
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <PrimaryButton
            label="Complete"
            onPress={() => onNext(allValues)}
            disabled={rankedValues.length < 3}
            variant="gradient"
            size="lg"
          />
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
  rankedSection: {
    marginBottom: theme.spacing[8],
  },
  unrankedSection: {
    marginBottom: theme.spacing[8],
  },
  sectionTitle: {
    ...theme.typography.styles.h3,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
  },
  rankedItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing[4],
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing[2],
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing[4],
  },
  rankNumber: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: "#fff",
  },
  valueText: {
    flex: 1,
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  rankControls: {
    flexDirection: "row",
    gap: theme.spacing[2],
  },
  rankButton: {
    padding: theme.spacing[2],
  },
  removeButton: {
    padding: theme.spacing[2],
  },
  hint: {
    ...theme.typography.styles.caption,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.tertiary,
    fontStyle: "italic",
    marginTop: theme.spacing[2],
  },
  unrankedItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing[4],
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing[2],
  },
  actions: {
    marginTop: "auto",
    paddingTop: theme.spacing[6],
  },
});

