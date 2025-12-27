/**
 * Hamburger Menu Button Component
 * Opens the drawer menu
 */

import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { DrawerNavigationProp } from "@react-navigation/drawer";

export function HamburgerButton() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  
  return (
    <Pressable
      style={styles.button}
      onPress={() => navigation.openDrawer()}
      hitSlop={8}
    >
      <MaterialIcons name="menu" size={24} color="#000000" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    marginLeft: 8,
  },
});

