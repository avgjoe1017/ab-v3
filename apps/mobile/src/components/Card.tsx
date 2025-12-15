import React from "react";
import { View, StyleSheet, ViewStyle, Pressable, PressableProps } from "react-native";
import { theme } from "../theme";

interface CardProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "elevated" | "surface";
  onPress?: () => void;
}

/**
 * Card - Standard card component with consistent styling
 */
export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = "default",
  onPress,
  ...pressableProps
}) => {
  const cardStyle = [
    styles.card,
    variant === "elevated" && styles.cardElevated,
    variant === "surface" && styles.cardSurface,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          cardStyle,
          pressed && styles.cardPressed,
        ]}
        onPress={onPress}
        {...pressableProps}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing[6],
  },
  cardElevated: {
    backgroundColor: theme.colors.background.surfaceElevated,
    borderColor: theme.colors.border.strong,
    ...theme.shadows.ios.md,
    ...theme.shadows.android.md,
  },
  cardSurface: {
    backgroundColor: theme.colors.background.secondary,
  },
  cardPressed: {
    opacity: 0.8,
  },
});

