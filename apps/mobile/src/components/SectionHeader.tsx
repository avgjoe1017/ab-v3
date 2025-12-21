import React from "react";
import { View, Text, StyleSheet, ViewStyle, Pressable } from "react-native";
import { theme } from "../theme/tokens";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

/**
 * SectionHeader - Standard section header with optional action
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  onActionPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && (
        <Pressable onPress={onActionPress}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing[3],
  },
  title: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
  },
  action: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
    color: "#212529",
    textDecorationLine: "underline",
  },
});
