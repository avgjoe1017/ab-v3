import React from "react";
import { View, StyleSheet, ViewStyle, Pressable, PressableProps } from "react-native";
import { theme } from "../theme";

interface GlassCardProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: "default" | "elevated" | "strong" | "subtle";
  onPress?: () => void;
}

/**
 * GlassCard - Frosted glass card component
 * Creates a serene, floating aesthetic with soft shadows and translucent backgrounds
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = "default",
  onPress,
  ...pressableProps
}) => {
  const cardStyle = [
    styles.card,
    variant === "elevated" && styles.cardElevated,
    variant === "strong" && styles.cardStrong,
    variant === "subtle" && styles.cardSubtle,
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
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.glass,
    padding: theme.spacing[6],
    // Soft, diffused shadow for floating effect
    ...theme.shadows.glass,
  },
  cardElevated: {
    backgroundColor: theme.colors.background.surfaceElevated,
    borderColor: "rgba(255, 255, 255, 0.6)",
    shadowOpacity: 0.1,
    shadowRadius: 28,
  },
  cardStrong: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderColor: "rgba(255, 255, 255, 0.7)",
    shadowOpacity: 0.12,
    shadowRadius: 32,
  },
  cardSubtle: {
    backgroundColor: theme.colors.background.surfaceSubtle,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowOpacity: 0.05,
    shadowRadius: 16,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
});
