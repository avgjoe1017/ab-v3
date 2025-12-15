import React from "react";
import { Text, Pressable, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../theme/tokens";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconPosition?: "left" | "right";
  disabled?: boolean;
  variant?: "primary" | "gradient" | "highlight";
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
}

/**
 * PrimaryButton - Primary action button with consistent styling
 * Minimum 44px height for accessibility
 */
export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  icon,
  iconPosition = "left",
  disabled = false,
  variant = "gradient",
  size = "md",
  style,
}) => {
  const height = size === "sm" ? 44 : size === "md" ? 56 : 64;
  const fontSize = size === "sm" ? 14 : size === "md" ? 18 : 20;
  const iconSize = size === "sm" ? 18 : size === "md" ? 24 : 28;

  const buttonContent = (
    <>
      {icon && iconPosition === "left" && (
        <MaterialIcons name={icon} size={iconSize} color="#fff" />
      )}
      <Text style={[styles.label, { fontSize }]}>{label}</Text>
      {icon && iconPosition === "right" && (
        <MaterialIcons name={icon} size={iconSize} color="#fff" />
      )}
    </>
  );

  if (variant === "gradient") {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.button,
          { height },
          pressed && styles.buttonPressed,
          disabled && styles.buttonDisabled,
          style,
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        <LinearGradient
          colors={theme.colors.gradients.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, { height }]}
        >
          {buttonContent}
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === "highlight") {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.button,
          styles.buttonHighlight,
          { height, backgroundColor: theme.colors.accent.highlight },
          pressed && styles.buttonPressed,
          disabled && styles.buttonDisabled,
          style,
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        {buttonContent}
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        styles.buttonPrimary,
        { height, backgroundColor: theme.colors.accent.primary },
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {buttonContent}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.radius.full,
    overflow: "hidden",
    minHeight: theme.layout.tapTargetMin,
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing[6],
    gap: theme.spacing[2],
  },
  buttonPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing[6],
    gap: theme.spacing[2],
  },
  buttonHighlight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing[6],
    gap: theme.spacing[2],
  },
  label: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: theme.typography.letterSpacing.wide,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

