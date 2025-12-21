import React from "react";
import { View, Text, Pressable, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../theme/tokens";
import { getSessionGradient } from "../lib/sessionArt";

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
 * Displays session with gradient/icon + title/subtitle + play affordance
 * Now uses DuotoneCard-style gradients instead of images
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

  // Get gradient and icon from session art utility
  const sessionGradient = getSessionGradient(displayId, goalTag);
  const displayIcon = icon || sessionGradient.icon;

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
        <LinearGradient
          colors={sessionGradient.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Oversized clipped icon */}
          <View style={styles.iconBackground}>
            <MaterialIcons
              name={displayIcon}
              size={isCompact ? 80 : isLarge ? 120 : 100}
              color={sessionGradient.iconColor}
              style={styles.oversizedIcon}
            />
          </View>
          
          {/* Play button overlay */}
          {!isCompact && (
            <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <MaterialIcons name="play-arrow" size={16} color="#fff" />
              </View>
            </View>
          )}
          
          {/* Saved button */}
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
                size={18}
                color="#ffffff"
              />
            </Pressable>
          )}
        </LinearGradient>
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
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
  },
  imageContainerCompact: {
    aspectRatio: 1.2,
  },
  imageContainerLarge: {
    borderRadius: theme.radius.xl,
  },
  gradient: {
    flex: 1,
    position: "relative",
  },
  iconBackground: {
    position: "absolute",
    top: -10,
    right: -15,
    opacity: 0.4,
  },
  oversizedIcon: {
    // Positioned to be partially clipped
  },
  playOverlay: {
    position: "absolute",
    bottom: theme.spacing[2],
    left: theme.spacing[2],
  },
  playButton: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  savedButton: {
    position: "absolute",
    top: theme.spacing[2],
    right: theme.spacing[2],
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
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
