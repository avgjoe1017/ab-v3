import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../theme/tokens";

interface AppScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
  backgroundColor?: string;
}

/**
 * AppScreen - Standard screen wrapper with safe area and background
 * Provides consistent layout across all screens
 */
export const AppScreen: React.FC<AppScreenProps> = ({
  children,
  style,
  gradient = true,
  backgroundColor,
}) => {
  return (
    <View style={[styles.container, style]}>
      {gradient ? (
        <LinearGradient
          colors={theme.colors.gradients.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            backgroundColor && { backgroundColor },
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

