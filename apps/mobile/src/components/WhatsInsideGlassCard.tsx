import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { GlassCard } from "./GlassCard";
import { theme } from "../theme";

interface Component {
  type: "voice" | "binaural" | "atmosphere";
  name: string;
  value: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}

interface WhatsInsideGlassCardProps {
  components: Component[];
}

/**
 * What's Inside Glass Card - High-contrast glass card showing session breakdown
 * Displays Voice, Binaural Beats, and Atmosphere with full transparency
 */
export const WhatsInsideGlassCard: React.FC<WhatsInsideGlassCardProps> = ({
  components,
}) => {
  return (
    <GlassCard variant="strong" style={styles.card}>
      <View style={styles.content}>
        {components.map((component, index) => (
          <View
            key={component.type}
            style={[
              styles.componentItem,
              index < components.length - 1 && styles.componentItemBorder,
            ]}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${component.color}20` }]}>
              <MaterialIcons name={component.icon} size={24} color={component.color} />
            </View>
            <View style={styles.componentContent}>
              <Text style={styles.componentLabel}>{component.name}</Text>
              <Text style={styles.componentValue}>{component.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: 0,
  },
  content: {
    gap: 0,
  },
  componentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[4],
    paddingVertical: theme.spacing[4],
  },
  componentItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  componentContent: {
    flex: 1,
    gap: theme.spacing[1],
  },
  componentLabel: {
    ...theme.typography.styles.caption,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: theme.typography.letterSpacing.wider,
  },
  componentValue: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});

