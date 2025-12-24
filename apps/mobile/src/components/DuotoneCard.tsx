import React from "react";
import { View, Text, StyleSheet, Pressable, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../theme";

// Preset color palettes for duotone cards
// Mesh-style gradient palettes - softer, multi-point blends (Apple-inspired)
export const DUOTONE_PALETTES = {
  // Lavender - primary brand color
  lavender: {
    background: ["#c8b8e8", "#b8a8d8", "#a090c0", "#9888b8"] as [string, string, string, string],
    locations: [0, 0.3, 0.7, 1] as [number, number, number, number],
    icon: "#d8c8f0",
  },
  // Sage - calm, grounding
  sage: {
    background: ["#a0c8b8", "#90b8a8", "#78a090", "#88a098"] as [string, string, string, string],
    locations: [0, 0.35, 0.7, 1] as [number, number, number, number],
    icon: "#b8dcd0",
  },
  // Sky - clarity, focus
  sky: {
    background: ["#a0b8d8", "#90a8c8", "#7890b0", "#8098b8"] as [string, string, string, string],
    locations: [0, 0.3, 0.75, 1] as [number, number, number, number],
    icon: "#b8d0f0",
  },
  // Rose - warmth, self-compassion
  rose: {
    background: ["#d8b0c0", "#c8a0b0", "#b08898", "#b890a0"] as [string, string, string, string],
    locations: [0, 0.35, 0.7, 1] as [number, number, number, number],
    icon: "#e8c8d8",
  },
  // Honey - energy, warmth
  honey: {
    background: ["#e8d0a0", "#d8c090", "#c8a870", "#d0b080"] as [string, string, string, string],
    locations: [0, 0.3, 0.75, 1] as [number, number, number, number],
    icon: "#f0e0b8",
  },
  // Twilight - evening, rest
  twilight: {
    background: ["#9888b8", "#8878a8", "#706090", "#786898"] as [string, string, string, string],
    locations: [0, 0.35, 0.7, 1] as [number, number, number, number],
    icon: "#b0a0c8",
  },
  // Mist - neutral, subtle
  mist: {
    background: ["#b8b0c8", "#a8a0b8", "#9088a0", "#9890a8"] as [string, string, string, string],
    locations: [0, 0.3, 0.75, 1] as [number, number, number, number],
    icon: "#c8c0d8",
  },
} as const;

export type DuotonePalette = keyof typeof DUOTONE_PALETTES;

interface DuotoneCardProps {
  /** Title text displayed on the card */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** MaterialIcons icon name for the oversized background graphic */
  icon: keyof typeof MaterialIcons.glyphMap;
  /** Color palette to use */
  palette?: DuotonePalette;
  /** Custom background colors (overrides palette) */
  backgroundColors?: [string, string];
  /** Custom icon color (overrides palette) */
  iconColor?: string;
  /** Size of the oversized icon (default: 180) */
  iconSize?: number;
  /** Press handler */
  onPress?: () => void;
  /** Additional styles */
  style?: ViewStyle;
  /** Card height (default: 140) */
  height?: number;
  /** Whether to show an arrow indicator */
  showArrow?: boolean;
  /** Custom content to render instead of title/subtitle */
  children?: React.ReactNode;
}

/**
 * DuotoneCard - A visually distinctive card with:
 * - Rounded corners for soft UI feel
 * - Duotone gradient background
 * - Oversized, clipped icon creating abstract background pattern
 */
export const DuotoneCard: React.FC<DuotoneCardProps> = ({
  title,
  subtitle,
  icon,
  palette = "lavender",
  backgroundColors,
  iconColor,
  iconSize = 180,
  onPress,
  style,
  height = 140,
  showArrow = false,
  children,
}) => {
  const paletteConfig = DUOTONE_PALETTES[palette];
  const bgColors = backgroundColors || paletteConfig.background;
  const bgLocations = backgroundColors ? undefined : paletteConfig.locations; // Only use locations for palette gradients
  const graphicColor = iconColor || paletteConfig.icon;

  const content = (
    <LinearGradient
      colors={bgColors}
      locations={bgLocations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { height }, style]}
    >
      {/* Oversized clipped icon - positioned to overflow */}
      <View style={styles.iconContainer}>
        <MaterialIcons
          name={icon}
          size={iconSize}
          color={graphicColor}
          style={styles.oversizedIcon}
        />
      </View>

      {/* Content overlay */}
      <View style={styles.content}>
        {children ? (
          children
        ) : (
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            )}
          </View>
        )}

        {showArrow && (
          <View style={styles.arrowContainer}>
            <MaterialIcons
              name="arrow-forward"
              size={20}
              color="rgba(255, 255, 255, 0.8)"
            />
          </View>
        )}
      </View>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  pressable: {
    borderRadius: theme.radius.xl,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  container: {
    borderRadius: theme.radius.xl,
    overflow: "hidden",
    position: "relative",
  },
  iconContainer: {
    position: "absolute",
    top: -20,
    right: -30,
    opacity: 0.4,
  },
  oversizedIcon: {
    // Icon is positioned to be partially clipped
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: theme.spacing[5],
  },
  textContainer: {
    flex: 1,
    gap: theme.spacing[1],
  },
  title: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600",
    color: "#ffffff",
    lineHeight: 24,
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 18,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: theme.spacing[3],
  },
});

export default DuotoneCard;

