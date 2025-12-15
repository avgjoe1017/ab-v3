import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Card } from "./Card";
import { theme } from "../theme";

export interface ScienceCardData {
  id: string;
  title: string;
  content: string;
  category: string;
  icon?: string;
}

interface ScienceCardProps {
  data: ScienceCardData;
  variant?: "default" | "compact";
  style?: ViewStyle;
  showIcon?: boolean;
}

/**
 * ScienceCard - Displays educational science content about binaural beats, affirmations, etc.
 * Used in HomeScreen, SessionDetailScreen, and onboarding flows.
 */
export const ScienceCard: React.FC<ScienceCardProps> = ({
  data,
  variant = "default",
  style,
  showIcon = true,
}) => {
  const iconName = data.icon || "science";

  return (
    <Card variant="default" style={[styles.card, style]}>
      <View style={styles.content}>
        {showIcon && (
          <View style={styles.iconContainer}>
            <MaterialIcons name={iconName as any} size={24} color={theme.colors.accent.primary} />
          </View>
        )}
        <View style={[styles.textContainer, !showIcon && styles.textContainerNoIcon]}>
          {variant === "default" && (
            <Text style={styles.title}>{data.title}</Text>
          )}
          <Text style={[styles.contentText, variant === "compact" && styles.contentTextCompact]}>
            {data.content}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing[4],
  },
  content: {
    flexDirection: "row",
    gap: theme.spacing[4],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    gap: theme.spacing[2],
  },
  textContainerNoIcon: {
    marginLeft: 0,
  },
  title: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  contentText: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.relaxed,
    color: theme.colors.text.secondary,
  },
  contentTextCompact: {
    fontSize: theme.typography.fontSize.xs,
  },
});

