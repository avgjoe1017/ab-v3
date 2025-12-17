import React from "react";
import { View, Text, Pressable, StyleSheet, ViewStyle, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../theme/tokens";
import { getSessionArtImage } from "../lib/sessionArt";

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
  
  // Get placeholder image for session art
  const sessionArtImage = getSessionArtImage(displayId);

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
      <View
        style={[
          styles.imageContainer,
          isCompact && styles.imageContainerCompact,
          isLarge && styles.imageContainerLarge,
        ]}
      >
        <Image
          source={sessionArtImage}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Gradient overlay for better text/icon visibility */}
        <LinearGradient
          colors={["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.4)"]}
          style={styles.imageOverlay}
        />
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
      </View>
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
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
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
    ...theme.typography.styles.cardTitle,
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

