import React from "react";
import { View, StyleSheet, ViewStyle, Pressable, PressableProps, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { theme } from "../theme";

interface CardProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: "default" | "elevated" | "surface";
  onPress?: () => void;
  animated?: boolean;
  haptic?: boolean;
}

/**
 * Card - Standard card component with consistent styling
 */
export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = "default",
  onPress,
  animated = true,
  haptic = true,
  ...pressableProps
}) => {
  // Animation values for subtle press feedback
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Trigger haptic feedback
  const triggerHapticFeedback = () => {
    if (haptic && onPress) {
      if (Platform.OS === "ios") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (Platform.OS === "android") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  // Animation handlers
  const handlePressIn = () => {
    "worklet";
    triggerHapticFeedback();
    if (animated) {
      scale.value = withSpring(0.98, {
        damping: 20,
        stiffness: 300,
        mass: 0.5,
      });
      opacity.value = withSpring(0.96, {
        damping: 20,
        stiffness: 300,
      });
    }
  };

  const handlePressOut = () => {
    "worklet";
    if (animated) {
      scale.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
        mass: 0.8,
      });
      opacity.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
      });
    }
  };

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    if (!animated) return {};
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const cardStyle = [
    styles.card,
    variant === "elevated" && styles.cardElevated,
    variant === "surface" && styles.cardSurface,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        style={cardStyle}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...pressableProps}
      >
        <Animated.View style={animatedStyle}>{children}</Animated.View>
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
});

