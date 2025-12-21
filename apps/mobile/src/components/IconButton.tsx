import React from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../theme/tokens";

interface IconButtonProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  size?: number;
  color?: string;
  variant?: "default" | "filled" | "subtle";
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

/**
 * IconButton - Icon-only button with consistent styling
 * Minimum 44px touch target for accessibility
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 24,
  color,
  variant = "default",
  disabled = false,
  style,
  accessibilityLabel,
}) => {
  const iconColor =
    color ||
    (variant === "default"
      ? theme.colors.text.primary
      : variant === "filled"
      ? theme.colors.text.primary
      : theme.colors.text.secondary);

  const minSize = Math.max(theme.layout.tapTargetMin, size + theme.spacing[4]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === "filled" && styles.buttonFilled,
        variant === "subtle" && styles.buttonSubtle,
        { width: minSize, height: minSize },
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel || icon}
      accessibilityRole="button"
    >
      <MaterialIcons name={icon} size={size} color={iconColor} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.full,
  },
  buttonFilled: {
    backgroundColor: theme.colors.background.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border.glass,
  },
  buttonSubtle: {
    backgroundColor: theme.colors.background.surfaceSubtle,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
});

