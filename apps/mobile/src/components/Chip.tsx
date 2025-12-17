import React from "react";
import { View, Text, Pressable, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { theme } from "../theme/tokens";

interface ChipProps {
  label: string;
  onPress?: () => void;
  active?: boolean;
  variant?: "default" | "primary";
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Chip - Tag/chip component for filters and labels
 */
export const Chip: React.FC<ChipProps> = ({
  label,
  onPress,
  active = false,
  variant = "default",
  style,
  textStyle,
}) => {
  const isPressable = !!onPress;

  const chipStyle = [
    styles.chip,
    variant === "primary" && styles.chipPrimary,
    active && variant === "default" && styles.chipActive,
    active && variant === "primary" && styles.chipPrimaryActive,
    style,
  ];

  const labelStyle = [
    styles.label,
    variant === "primary" && styles.labelPrimary,
    active && variant === "default" && styles.labelActive,
    active && variant === "primary" && styles.labelPrimaryActive,
    textStyle,
  ];

  if (isPressable) {
    return (
      <Pressable
        style={({ pressed }) => [
          chipStyle,
          pressed && styles.chipPressed,
        ]}
        onPress={onPress}
      >
        <Text style={labelStyle}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <View style={chipStyle}>
      <Text style={labelStyle}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    alignSelf: "flex-start",
  },
  chipPrimary: {
    backgroundColor: theme.colors.accent.primary,
    borderColor: theme.colors.accent.primary,
  },
  chipActive: {
    backgroundColor: theme.colors.background.surfaceElevated,
    borderColor: theme.colors.accent.primary,
  },
  chipPrimaryActive: {
    backgroundColor: theme.colors.accent.primary,
  },
  label: {
    ...theme.typography.styles.label,
    color: theme.colors.text.secondary,
  },
  labelPrimary: {
    ...theme.typography.styles.label,
    color: theme.colors.text.primary,
  },
  labelActive: {
    ...theme.typography.styles.label,
    color: theme.colors.text.primary,
  },
  labelPrimaryActive: {
    ...theme.typography.styles.label,
    color: theme.colors.text.primary,
  },
  chipPressed: {
    opacity: 0.8,
  },
});

