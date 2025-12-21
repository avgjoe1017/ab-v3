import React from "react";
import { View, StyleSheet, ViewStyle, Pressable, PressableProps } from "react-native";
import { theme } from "../theme";

interface CardProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
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
    borderColor: theme.colors.border.glass,
    padding: theme.spacing[6],
    ...theme.shadows.ios.sm,
    ...theme.shadows.android.sm,
  },
  cardElevated: {
    backgroundColor: theme.colors.background.surfaceElevated,
    borderColor: "rgba(255, 255, 255, 0.6)",
    ...theme.shadows.glass,
  },
  cardSurface: {
    backgroundColor: theme.colors.background.surfaceSubtle,
    borderColor: theme.colors.border.glass,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});

