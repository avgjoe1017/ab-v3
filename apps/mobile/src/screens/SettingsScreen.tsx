import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AppScreen, IconButton, SectionHeader, ScienceCard } from "../components";
import { theme } from "../theme";
import { getWhyWeDontContent } from "../lib/science";

export default function SettingsScreen({ navigation }: any) {
  const whyWeDontContent = getWhyWeDontContent();

  return (
    <AppScreen>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-back"
            onPress={() => navigation.goBack()}
            variant="filled"
          />
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Our Approach Section */}
        <View style={styles.section}>
          <SectionHeader title="Our Approach" />
          <Text style={styles.sectionDescription}>
            Entrain is built on transparency and evidence-based practice. Here's what we deliberately exclude and why.
          </Text>

          {whyWeDontContent.map((item) => (
            <View key={item.id} style={styles.cardContainer}>
              <ScienceCard data={item} variant="default" />
            </View>
          ))}
        </View>

        {/* Additional Info */}
        <View style={styles.section}>
          <SectionHeader title="About Entrain" />
          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>
              Entrain is designed to be the honest binaural beat app. We believe you deserve to know exactly what frequencies you're hearing, why they work, and what methods we use—and don't use—based on scientific evidence.
            </Text>
            <Text style={styles.aboutText}>
              Every feature in Entrain is intentionally chosen based on peer-reviewed research, not marketing claims.
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing[6],
    paddingBottom: theme.spacing[4],
  },
  headerTitle: {
    ...theme.typography.styles.h1,
    fontSize: theme.typography.fontSize["2xl"],
    color: theme.colors.text.primary,
    marginLeft: theme.spacing[4],
  },
  headerSpacer: {
    flex: 1,
  },
  section: {
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[8],
  },
  sectionDescription: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.relaxed,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[2],
    marginBottom: theme.spacing[6],
  },
  cardContainer: {
    marginBottom: theme.spacing[4],
  },
  aboutCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing[6],
    gap: theme.spacing[4],
  },
  aboutText: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.relaxed,
    color: theme.colors.text.secondary,
  },
});

