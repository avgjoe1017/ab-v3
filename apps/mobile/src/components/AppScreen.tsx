import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../theme/tokens";

type GradientPreset = "default" | "calm" | "player" | "hero" | "sleep" | "focus" | "energy";

interface AppScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
  gradientPreset?: GradientPreset;
  backgroundColor?: string;
}

/**
 * AppScreen - Standard screen wrapper with safe area and serene background
 * Provides consistent layout with calm, atmospheric gradients
 */
export const AppScreen: React.FC<AppScreenProps> = ({
  children,
  style,
  gradient = true,
  gradientPreset = "default",
  backgroundColor,
}) => {
  const getGradientColors = (): readonly [string, string, ...string[]] => {
    switch (gradientPreset) {
      case "calm":
        return theme.colors.gradients.calm as readonly [string, string, ...string[]];
      case "player":
        return theme.colors.gradients.player as readonly [string, string, ...string[]];
      case "hero":
        return theme.colors.gradients.hero as readonly [string, string, ...string[]];
      case "sleep":
        return theme.colors.gradients.sleep as readonly [string, string, ...string[]];
      case "focus":
        return theme.colors.gradients.focus as readonly [string, string, ...string[]];
      case "energy":
        return theme.colors.gradients.energy as readonly [string, string, ...string[]];
      default:
        return theme.colors.gradients.background as readonly [string, string, ...string[]];
    }
  };

  return (
    <View style={[styles.container, style]}>
      {gradient ? (
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: backgroundColor || theme.colors.background.primary },
          ]}
        />
      )}
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {children}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});
