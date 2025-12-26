import React from "react";
import { Text, Pressable, StyleSheet, ViewStyle, TextStyle, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
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
  animated?: boolean;
  haptic?: boolean;
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
  animated = true,
  haptic = true,
}) => {
  const height = size === "sm" ? 44 : size === "md" ? 56 : 64;
  // Use button typography style - size variants maintain accessibility
  const iconSize = size === "sm" ? 18 : size === "md" ? 24 : 28;

  // Animation values for smooth spring animations
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Trigger haptic feedback
  const triggerHapticFeedback = () => {
    if (haptic && !disabled) {
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
      scale.value = withSpring(1.02, {
        damping: 15,
        stiffness: 400,
        mass: 0.5,
      });
      opacity.value = withSpring(0.95, {
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
        stiffness: 400,
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
      opacity: opacity.value * (disabled ? 0.5 : 1),
    };
  });

  const buttonContent = (
    <>
      {icon && iconPosition === "left" && (
        <MaterialIcons name={icon} size={iconSize} color="#fff" />
      )}
      <Text style={styles.label}>{label}</Text>
      {icon && iconPosition === "right" && (
        <MaterialIcons name={icon} size={iconSize} color="#fff" />
      )}
    </>
  );

  if (variant === "gradient") {
    return (
      <Pressable
        style={[styles.button, { height }, disabled && styles.buttonDisabled, style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <Animated.View style={[animatedStyle, { height }]}>
          <LinearGradient
            colors={theme.colors.gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradient, { height }]}
          >
            {buttonContent}
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

  if (variant === "highlight") {
    return (
      <Pressable
        style={[styles.button, styles.buttonHighlight, { height }, disabled && styles.buttonDisabled, style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <Animated.View
          style={[
            animatedStyle,
            styles.buttonHighlight,
            { height, backgroundColor: theme.colors.accent.highlight },
          ]}
        >
          {buttonContent}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[styles.button, styles.buttonPrimary, { height }, disabled && styles.buttonDisabled, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          animatedStyle,
          styles.buttonPrimary,
          { height, backgroundColor: theme.colors.accent.primary },
        ]}
      >
        {buttonContent}
      </Animated.View>
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
    ...theme.typography.styles.button,
    color: theme.colors.text.inverse,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

