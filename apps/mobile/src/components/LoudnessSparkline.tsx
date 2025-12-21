import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { theme } from "../theme";

interface LoudnessSparklineProps {
  data: number[]; // Array of LUFS values (typically 10-20 points)
  width?: number;
  height?: number;
  color?: string;
  style?: ViewStyle;
}

/**
 * LoudnessSparkline - Tiny line graph visualizing LUFS (Loudness Units) measurements
 * Used next to volume sliders to show audio consistency
 */
export const LoudnessSparkline: React.FC<LoudnessSparklineProps> = ({
  data,
  width = 60,
  height = 20,
  color = theme.colors.accent.highlight,
  style,
}) => {
  if (!data || data.length === 0) {
    return <View style={[styles.container, { width, height }, style]} />;
  }

  // Normalize data to fit within height
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Avoid division by zero

  const normalizedData = data.map((value) => {
    const normalized = ((value - min) / range) * (height - 4) + 2; // Add 2px padding
    return Math.max(2, Math.min(height - 2, normalized)); // Clamp to bounds
  });

  // Calculate points for line
  const pointWidth = width / (data.length - 1);
  const points = normalizedData
    .map((y, index) => `${index * pointWidth},${height - y}`)
    .join(" ");

  return (
    <View style={[styles.container, { width, height }, style]}>
      <View style={styles.sparklineContainer}>
        {/* Simple line visualization using View bars */}
        {normalizedData.map((height, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              {
                width: Math.max(1, pointWidth - 1),
                height: height,
                backgroundColor: color,
                opacity: 0.6 + (height / (height - 2)) * 0.4, // Vary opacity
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  sparklineContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    width: "100%",
    height: "100%",
  },
  bar: {
    borderRadius: 0.5,
  },
});

