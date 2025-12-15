import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AppScreen, PrimaryButton, Chip } from "../components";
import { theme } from "../theme/tokens";

interface ValueSelectionScreenProps {
  onNext: (selectedValues: Value[]) => void;
  onBack: () => void;
}

export interface Value {
  valueId: string;
  valueText: string;
}

// Value categories from roadmap (research-backed)
const AVAILABLE_VALUES: Value[] = [
  { valueId: "achievement", valueText: "Achievement & Success" },
  { valueId: "connection", valueText: "Connection & Relationships" },
  { valueId: "health", valueText: "Health & Vitality" },
  { valueId: "creativity", valueText: "Creativity & Expression" },
  { valueId: "peace", valueText: "Peace & Balance" },
  { valueId: "growth", valueText: "Growth & Learning" },
  { valueId: "freedom", valueText: "Freedom & Independence" },
  { valueId: "purpose", valueText: "Purpose & Contribution" },
  { valueId: "security", valueText: "Security & Stability" },
  { valueId: "adventure", valueText: "Adventure & Excitement" },
  { valueId: "authenticity", valueText: "Authenticity & Honesty" },
  { valueId: "compassion", valueText: "Compassion & Kindness" },
  { valueId: "courage", valueText: "Courage & Bravery" },
  { valueId: "gratitude", valueText: "Gratitude & Appreciation" },
  { valueId: "wisdom", valueText: "Wisdom & Understanding" },
  { valueId: "joy", valueText: "Joy & Happiness" },
  { valueId: "integrity", valueText: "Integrity & Ethics" },
  { valueId: "resilience", valueText: "Resilience & Perseverance" },
];

export default function ValueSelectionScreen({ onNext, onBack }: ValueSelectionScreenProps) {
  const [selectedValues, setSelectedValues] = useState<Value[]>([]);

  const toggleValue = (value: Value) => {
    if (selectedValues.find((v) => v.valueId === value.valueId)) {
      setSelectedValues(selectedValues.filter((v) => v.valueId !== value.valueId));
    } else {
      if (selectedValues.length < 7) {
        // Allow up to 7 selections
        setSelectedValues([...selectedValues, value]);
      }
    }
  };

  const canProceed = selectedValues.length >= 3 && selectedValues.length <= 7;

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </Pressable>
          <Text style={styles.title}>Select Your Values</Text>
          <Text style={styles.subtitle}>
            Choose 3-7 values that matter most to you
          </Text>
        </View>

        <View style={styles.selectionInfo}>
          <Text style={styles.selectionCount}>
            {selectedValues.length} selected {selectedValues.length === 1 ? "value" : "values"}
          </Text>
        </View>

        <View style={styles.valuesGrid}>
          {AVAILABLE_VALUES.map((value) => {
            const isSelected = selectedValues.some((v) => v.valueId === value.valueId);
            const isDisabled = !isSelected && selectedValues.length >= 7;
            return (
              <Chip
                key={value.valueId}
                label={value.valueText}
                active={isSelected}
                onPress={isDisabled ? undefined : () => toggleValue(value)}
                variant={isSelected ? "primary" : "default"}
              />
            );
          })}
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label={selectedValues.length >= 3 ? "Continue" : `Select ${3 - selectedValues.length} more`}
            onPress={() => onNext(selectedValues)}
            disabled={!canProceed}
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
  selectionInfo: {
    marginBottom: theme.spacing[4],
  },
  selectionCount: {
    ...theme.typography.styles.caption,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  valuesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[2],
    marginBottom: theme.spacing[8],
  },
  actions: {
    marginTop: "auto",
    paddingTop: theme.spacing[6],
  },
});

