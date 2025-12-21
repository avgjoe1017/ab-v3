import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../theme/tokens";

export type TabRoute = "Today" | "Explore" | "Library";

interface BottomTabsProps {
  activeRoute: TabRoute;
  onNavigate: (route: TabRoute) => void;
  showBadge?: boolean;
}

interface TabItem {
  route: TabRoute;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}

const TABS: TabItem[] = [
  { route: "Today", icon: "auto-awesome", label: "Home" },
  { route: "Explore", icon: "explore", label: "Explore" },
  { route: "Library", icon: "library-music", label: "My Library" },
];

/**
 * BottomTabs - Global bottom navigation component
 * Consistent navigation pattern across all screens
 */
export const BottomTabs: React.FC<BottomTabsProps> = ({
  activeRoute,
  onNavigate,
  showBadge = false,
}) => {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = activeRoute === tab.route;
        const showTabBadge = showBadge && tab.route === "Today";

        return (
          <Pressable
            key={tab.route}
            style={styles.tab}
            onPress={() => onNavigate(tab.route)}
          >
            <View style={styles.iconContainer}>
              <MaterialIcons
                name={tab.icon}
                size={24}
                color={isActive ? theme.colors.accent.secondary : theme.colors.text.muted}
              />
              {showTabBadge && <View style={styles.badge} />}
            </View>
            <Text
              style={[
                styles.label,
                isActive && styles.labelActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: theme.colors.background.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.default,
    paddingBottom: theme.spacing[6],
    paddingTop: theme.spacing[2],
    paddingHorizontal: theme.spacing[6],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tab: {
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing[1],
    width: 64,
    minHeight: theme.layout.tapTargetMin,
    justifyContent: "center",
  },
  iconContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    backgroundColor: theme.colors.accent.secondary,
    borderRadius: 4,
  },
  label: {
    ...theme.typography.styles.caption,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    fontWeight: theme.typography.fontWeight.medium,
  },
  labelActive: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
});

