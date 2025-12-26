import React from "react";
import { View, Text, StyleSheet, SafeAreaView, Image } from "react-native";
import { AppScreen } from "../components";
import { theme } from "../theme";
import { ParallaxScrollView } from "../components/bna-ui";

/**
 * Example screen demonstrating ParallaxScrollView
 */
export default function ParallaxExampleScreen({ navigation }: any) {
  return (
    <AppScreen>
      <SafeAreaView style={styles.container}>
        <ParallaxScrollView
          headerHeight={300}
          headerImage={
            <View style={styles.headerImage}>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Parallax ScrollView</Text>
                <Text style={styles.headerSubtitle}>Smooth scrolling hero section</Text>
              </View>
            </View>
          }
        >
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Content Section 1</Text>
            <Text style={styles.bodyText}>
              As you scroll, notice how the header image scales and translates.
              This creates a beautiful parallax effect that enhances the visual
              experience of your content.
            </Text>

            <Text style={styles.sectionTitle}>Content Section 2</Text>
            <Text style={styles.bodyText}>
              The header maintains its aspect ratio and smoothly transitions as
              you scroll. This is perfect for profile screens, article headers,
              or any hero section you want to emphasize.
            </Text>

            <Text style={styles.sectionTitle}>Content Section 3</Text>
            <Text style={styles.bodyText}>
              Scroll up and down to see the parallax effect in action. The
              animation is smooth and performant, running on the native thread
              for optimal performance.
            </Text>

            <Text style={styles.sectionTitle}>Content Section 4</Text>
            <Text style={styles.bodyText}>
              This component is built with react-native-reanimated for smooth,
              hardware-accelerated animations. Perfect for creating polished,
              professional user interfaces.
            </Text>

            <View style={styles.spacer} />
          </View>
        </ParallaxScrollView>
      </SafeAreaView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  headerImage: {
    flex: 1,
    width: "100%",
    backgroundColor: theme.colors.accent.primary,
    justifyContent: "flex-end",
    padding: theme.spacing[6],
  },
  headerContent: {
    marginBottom: theme.spacing[4],
  },
  headerTitle: {
    ...theme.typography.styles.h1,
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing[2],
  },
  headerSubtitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.inverse,
    opacity: 0.9,
  },
  content: {
    padding: theme.spacing[6],
    gap: theme.spacing[6],
  },
  sectionTitle: {
    ...theme.typography.styles.sectionHeading,
  },
  bodyText: {
    ...theme.typography.styles.body,
    marginTop: theme.spacing[2],
  },
  spacer: {
    height: theme.spacing[16],
  },
});

