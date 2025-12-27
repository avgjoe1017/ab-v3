/**
 * Choice Chips Component
 * Renders selectable chip rows
 */

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../../theme";
import type { ChipAction } from "../types";

interface ChoiceChipsProps {
  chips: ChipAction[];
  onChipPress: (action: ChipAction) => void;
  /** Optional: currently selected chip id */
  selectedId?: string;
  /** Optional: wrap to multiple lines (default: true) */
  wrap?: boolean;
}

export function ChoiceChips({ chips, onChipPress, selectedId, wrap = true }: ChoiceChipsProps) {
  return (
    <View style={[styles.container, wrap && styles.containerWrap]}>
      {chips.map((chip) => {
        const isSelected = selectedId === chip.id;
        const isPrimary = chip.primary && !selectedId;
        
        return (
          <Pressable
            key={chip.id}
            style={[
              styles.chip,
              isPrimary && styles.chipPrimary,
              isSelected && styles.chipSelected,
            ]}
            onPress={() => onChipPress(chip)}
          >
            {chip.icon && (
              <MaterialIcons
                name={chip.icon as keyof typeof MaterialIcons.glyphMap}
                size={16}
                color={isSelected || isPrimary ? "#FFFFFF" : theme.colors.text.primary}
                style={styles.chipIcon}
              />
            )}
            <Text style={[
              styles.chipText,
              isPrimary && styles.chipTextPrimary,
              isSelected && styles.chipTextSelected,
            ]}>
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  containerWrap: {
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  chipPrimary: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  chipSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  chipTextPrimary: {
    color: "#FFFFFF",
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
});

