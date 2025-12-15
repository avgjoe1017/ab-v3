import React from "react";
import { View, Text, Pressable, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../theme/tokens";

interface SessionTileProps {
  id?: string;
  sessionId: string;
  title: string;
  goalTag?: string;
  onPress: () => void;
  onToggleSaved?: () => void;
  isSaved?: boolean;
  variant?: "default" | "compact" | "large";
  style?: ViewStyle;
  icon?: keyof typeof MaterialIcons.glyphMap;
}

/**
 * SessionTile - Standard session card component
 * Displays session with image/title/subtitle + play affordance
 */
export const SessionTile: React.FC<SessionTileProps> = ({
  id,
  sessionId,
  title,
  goalTag,
  onPress,
  onToggleSaved,
  isSaved,
  variant = "default",
  style,
  icon,
}) => {
  const displayId = sessionId || id || "";
  const isCompact = variant === "compact";
  const isLarge = variant === "large";

  // Determine icon based on goalTag if not provided
  const displayIcon = icon || getIconForGoalTag(goalTag);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        isCompact && styles.containerCompact,
        isLarge && styles.containerLarge,
        pressed && styles.pressed,
        style,
      ]}
      onPress={onPress}
    >
      <LinearGradient
        colors={getGradientForGoalTag(goalTag)}
        style={[
          styles.imageContainer,
          isCompact && styles.imageContainerCompact,
          isLarge && styles.imageContainerLarge,
        ]}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons
            name={displayIcon}
            size={isCompact ? 20 : isLarge ? 32 : 24}
            color={theme.colors.accent.secondary}
          />
        </View>
        {!isCompact && (
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <MaterialIcons name="play-arrow" size={16} color="#fff" />
            </View>
          </View>
        )}
        {onToggleSaved && (
          <Pressable
            style={styles.savedButton}
            onPress={(e) => {
              e.stopPropagation();
              onToggleSaved();
            }}
            hitSlop={8}
          >
            <MaterialIcons
              name={isSaved ? "bookmark" : "bookmark-border"}
              size={20}
              color={isSaved ? theme.colors.accent.highlight : theme.colors.text.primary}
            />
          </Pressable>
        )}
      </LinearGradient>
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            isCompact && styles.titleCompact,
            isLarge && styles.titleLarge,
          ]}
          numberOfLines={isCompact ? 1 : 2}
        >
          {title}
        </Text>
        {goalTag && !isCompact && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {formatGoalTag(goalTag)}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

// Helper functions
function getIconForGoalTag(goalTag?: string): keyof typeof MaterialIcons.glyphMap {
  switch (goalTag) {
    case "anxiety":
    case "beginner":
      return "self-improvement";
    case "resilience":
      return "bolt";
    case "productivity":
      return "check-circle";
    case "sleep":
      return "bedtime";
    case "focus":
      return "psychology";
    default:
      return "self-improvement";
  }
}

function getGradientForGoalTag(goalTag?: string): [string, string, ...string[]] {
  switch (goalTag) {
    case "sleep":
      return ["#3b82f6", "#1e40af"];
    case "focus":
      return ["#a855f7", "#7c3aed"];
    case "anxiety":
    case "beginner":
      return ["#14b8a6", "#0d9488"];
    case "resilience":
    case "productivity":
      return ["#6366f1", "#8b5cf6"];
    default:
      return ["#6366f1", "#8b5cf6"];
  }
}

function formatGoalTag(goalTag: string): string {
  return goalTag
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    flexDirection: "column",
    gap: theme.spacing[2],
  },
  containerCompact: {
    width: 120,
  },
  containerLarge: {
    width: 180,
  },
  pressed: {
    opacity: 0.8,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  imageContainerCompact: {
    aspectRatio: 1.2,
  },
  imageContainerLarge: {
    borderRadius: theme.radius.xl,
  },
  iconContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  playOverlay: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  savedButton: {
    position: "absolute",
    top: theme.spacing[2],
    right: theme.spacing[2],
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    gap: theme.spacing[1],
  },
  title: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  titleCompact: {
    fontSize: theme.typography.fontSize.sm,
  },
  titleLarge: {
    fontSize: theme.typography.fontSize.lg,
  },
  subtitle: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.tertiary,
  },
});

