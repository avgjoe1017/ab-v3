import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

const BAR_HEIGHT = 78;          // taller so labels fit
const ICON_SLOT = 40;           // fixed slot = centered icons
const SIDE_MARGIN = 18;
const BOTTOM_GAP = 10;

function metaForRoute(routeName: string) {
  const key = routeName.toLowerCase();

  // Match your route names: "Today", "Explore", "Library"
  if (key.includes("today") || key.includes("home") || key === "index") {
    return { icon: "auto-awesome" as const, fallbackLabel: "Today" };
  }
  if (key.includes("explore")) {
    return { icon: "explore" as const, fallbackLabel: "Explore" };
  }
  if (key.includes("library")) {
    return { icon: "favorite" as const, fallbackLabel: "Library" };
  }

  return { icon: "circle" as const, fallbackLabel: routeName };
}

export default function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.container,
          {
            height: BAR_HEIGHT,
            left: SIDE_MARGIN,
            right: SIDE_MARGIN,
            bottom: insets.bottom + BOTTOM_GAP,
          },
        ]}
      >
        <BlurView
          intensity={80}
          tint="light"
          style={styles.blurView}
        >
          <View style={styles.bar}>
            {state.routes.map((route, index) => {
              const isFocused = state.index === index;
              const { options } = descriptors[route.key];

              const { icon, fallbackLabel } = metaForRoute(route.name);

              const labelRaw =
                options.tabBarLabel ?? options.title ?? fallbackLabel;

              const label =
                typeof labelRaw === "string" ? labelRaw : fallbackLabel;

              const onPress = () => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              return (
                <Pressable
                  key={route.key}
                  onPress={onPress}
                  style={styles.tab}
                  hitSlop={12}
                >
                  <View style={[styles.iconSlot, isFocused && styles.iconSlotActive]}>
                    <MaterialIcons
                      name={icon}
                      size={22}
                      color={isFocused ? "#FFFFFF" : "#111111"}
                    />
                  </View>

                  <Text
                    style={[styles.label, isFocused && styles.labelActive]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",

    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  blurView: {
    flex: 1,
    borderRadius: 999,
  },
  bar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  iconSlot: {
    width: ICON_SLOT,
    height: ICON_SLOT,
    borderRadius: ICON_SLOT / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  iconSlotActive: {
    backgroundColor: "#111111",
  },
  label: {
    fontSize: 11,
    color: "rgba(17,17,17,0.55)",
    letterSpacing: 0.2,
    fontWeight: "400",
  },
  labelActive: {
    color: "#111111",
    fontWeight: "600",
  },
});

