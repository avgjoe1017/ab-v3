import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../theme";
import { getSessionGradient } from "../lib/sessionArt";
import type { HeroSession } from "./ExploreHeroDeck";

interface HeroDeckCardProps {
  session: HeroSession;
  onStart: (session: HeroSession) => void;
  onPreview?: (session: HeroSession) => void;
  onOpenDetails?: (session: HeroSession) => void;
}

export function HeroDeckCard({
  session,
  onStart,
  onPreview,
  onOpenDetails,
}: HeroDeckCardProps) {
  const gradient = getSessionGradient(session.id, session.goalTag);
  const gradientColors = [gradient.colors[0], gradient.colors[1], gradient.colors[1]] as [string, string, string];

  const intensityText = session.intensity || "Medium";

  return (
    <Pressable
      style={styles.card}
      onPress={() => onOpenDetails?.(session)}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Decorative icon */}
        <View style={styles.iconContainer}>
          <MaterialIcons
            name={gradient.icon}
            size={120}
            color="rgba(255, 255, 255, 0.15)"
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Category badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{session.category}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {session.title}
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle} numberOfLines={1}>
            {session.subtitle}
          </Text>

          {/* Metadata row */}
          <View style={styles.metadataRow}>
            <View style={styles.metadataItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="rgba(255,255,255,0.6)" />
              <Text style={styles.metadataText}>{intensityText}</Text>
            </View>
          </View>

          {/* CTA Button */}
          <Pressable
            style={styles.startButton}
            onPress={(e) => {
              e.stopPropagation();
              onStart(session);
            }}
          >
            <Text style={styles.startButtonText}>Start</Text>
            <MaterialIcons name="play-arrow" size={20} color="#ffffff" />
          </Pressable>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 300,
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.2,
    shadowRadius: 35,
    elevation: 14,
  },
  gradient: {
    flex: 1,
    padding: theme.spacing[5],
    justifyContent: "space-between",
    position: "relative",
  },
  iconContainer: {
    position: "absolute",
    top: -20,
    right: -30,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    zIndex: 10,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: theme.radius.full,
    marginBottom: theme.spacing[3],
  },
  categoryText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 11,
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  title: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: theme.spacing[1],
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: theme.spacing[3],
    lineHeight: 20,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
    marginBottom: theme.spacing[4],
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
  },
  metadataText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing[2],
    height: 52,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  startButtonText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
  },
});

