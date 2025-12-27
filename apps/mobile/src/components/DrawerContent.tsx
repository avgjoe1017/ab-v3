/**
 * Custom Drawer Content Component
 * Side menu with navigation items
 */

import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";

export function DrawerContent({ navigation, state }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  
  const menuItems = [
    {
      name: "Compose",
      route: "Compose",
      icon: "chat-bubble-outline" as const,
    },
    {
      name: "Today",
      route: "Today",
      icon: "auto-awesome" as const,
    },
    {
      name: "Explore",
      route: "Explore",
      icon: "explore" as const,
    },
    {
      name: "Library",
      route: "Library",
      icon: "favorite" as const,
    },
    {
      name: "Settings",
      route: "Settings",
      icon: "settings" as const,
    },
  ];
  
  const currentRoute = state.routes[state.index]?.name;
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Affirmation Beats</Text>
      </View>
      
      <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
        {menuItems.map((item) => {
          const isActive = currentRoute === item.route;
          
          return (
            <Pressable
              key={item.route}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => {
                navigation.navigate(item.route);
                navigation.closeDrawer();
              }}
            >
              <MaterialIcons
                name={item.icon}
                size={24}
                color={isActive ? "#007AFF" : "#666666"}
                style={styles.menuIcon}
              />
              <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                {item.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
  },
  menu: {
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  menuItemActive: {
    backgroundColor: "#F2F2F7",
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  menuIcon: {
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666666",
  },
  menuTextActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
});

