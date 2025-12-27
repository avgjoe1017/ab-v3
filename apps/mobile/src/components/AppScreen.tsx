import React from "react";
import { View, StyleSheet, ViewStyle, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../theme/tokens";
import { HamburgerButton } from "./HamburgerButton";

type GradientPreset = "default" | "calm" | "player" | "hero" | "sleep" | "focus" | "energy";

interface AppScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
  gradientPreset?: GradientPreset;
  backgroundColor?: string;
  title?: string;
  showHamburger?: boolean;
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
  title,
  showHamburger = false,
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
        {(showHamburger || title) && (
          <View style={styles.header}>
            {showHamburger && <HamburgerButton />}
            {title && <Text style={styles.headerTitle}>{title}</Text>}
            {showHamburger && !title && <View style={styles.headerSpacer} />}
          </View>
        )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40, // Match hamburger button width
  },
});
