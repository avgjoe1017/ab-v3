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
 * Design: Dark filled when active, light outlined when inactive
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
    active && styles.chipActive,
    style,
  ];

  const labelStyle = [
    styles.label,
    active && styles.labelActive,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dee2e6",
    alignSelf: "flex-start",
  },
  chipActive: {
    backgroundColor: "#212529",
    borderColor: "#212529",
  },
  label: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 14,
    fontWeight: "500",
    color: "#212529",
  },
  labelActive: {
    color: "#ffffff",
  },
  chipPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
