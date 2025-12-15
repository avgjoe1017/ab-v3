import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AppScreen, SectionHeader, IconButton, Card, PrimaryButton } from "../components";
import { theme } from "../theme";
import { PLACEHOLDER_PROGRAMS, type Program } from "../types/program";
import { useQuery } from "@tanstack/react-query";
import { getProgramCompletion } from "../storage/programProgress";

export default function ProgramsListScreen({ navigation }: any) {
  // Fetch programs from API (for now using placeholders)
  // TODO: Replace with actual API call when backend is ready
  const programs = PLACEHOLDER_PROGRAMS;

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
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Programs</Text>
            <Text style={styles.headerSubtitle}>Structured journeys, one day at a time</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Intro */}
        <View style={styles.intro}>
          <Text style={styles.introText}>
            Follow a structured path with daily sessions. Complete one session per day at your own pace.
          </Text>
        </View>

        {/* Programs List */}
        <View style={styles.programsList}>
          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onPress={() => navigation.navigate("ProgramDetail", { programId: program.id })}
            />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </AppScreen>
  );
}

interface ProgramCardProps {
  program: Program;
  onPress: () => void;
}

function ProgramCard({ program, onPress }: ProgramCardProps) {
  const { data: completion } = useQuery({
    queryKey: ["program-completion", program.id],
    queryFn: async () => {
      const { getProgramCompletion } = await import("../storage/programProgress");
      return getProgramCompletion(program.id, program.totalDays);
    },
  });

  const completionPercent = completion ?? 0;
  const isStarted = completionPercent > 0;
  const isComplete = completionPercent === 100;

  return (
    <Card variant="elevated" onPress={onPress} style={styles.programCard}>
      <View style={styles.programHeader}>
        <View style={styles.programInfo}>
          <Text style={styles.programTitle}>{program.title}</Text>
          <Text style={styles.programDescription}>{program.description}</Text>
        </View>
        {isComplete && (
          <View style={styles.completeBadge}>
            <MaterialIcons name="check-circle" size={24} color={theme.colors.semantic.success} />
          </View>
        )}
      </View>

      {/* Progress Bar */}
      {(isStarted || isComplete) && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${completionPercent}%` },
                isComplete && styles.progressFillComplete,
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {completionPercent}% complete
          </Text>
        </View>
      )}

      {/* Metadata */}
      <View style={styles.programMeta}>
        <View style={styles.metaItem}>
          <MaterialIcons name="schedule" size={16} color={theme.colors.text.tertiary} />
          <Text style={styles.metaText}>{program.totalDays} days</Text>
        </View>
        {program.goalTag && (
          <View style={styles.metaItem}>
            <MaterialIcons name="tag" size={16} color={theme.colors.text.tertiary} />
            <Text style={styles.metaText}>{program.goalTag}</Text>
          </View>
        )}
      </View>

      {/* Action Button */}
      <View style={styles.programAction}>
        <PrimaryButton
          label={isComplete ? "Review Program" : isStarted ? "Continue" : "Start Program"}
          onPress={onPress}
          variant="gradient"
          size="sm"
          icon={isComplete ? "refresh" : isStarted ? "play-arrow" : "play-arrow"}
          iconPosition="left"
        />
      </View>
    </Card>
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
    justifyContent: "space-between",
    padding: theme.spacing[6],
    paddingBottom: theme.spacing[4],
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    gap: theme.spacing[1],
  },
  headerSpacer: {
    width: 44,
  },
  headerTitle: {
    ...theme.typography.styles.h1,
    fontSize: theme.typography.fontSize["3xl"],
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.tertiary,
    textAlign: "center",
  },
  intro: {
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[6],
  },
  introText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: theme.typography.lineHeight.relaxed,
  },
  programsList: {
    paddingHorizontal: theme.spacing[6],
    gap: theme.spacing[4],
  },
  programCard: {
    gap: theme.spacing[4],
  },
  programHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  programInfo: {
    flex: 1,
    gap: theme.spacing[1],
  },
  programTitle: {
    ...theme.typography.styles.h2,
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
  },
  programDescription: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },
  completeBadge: {
    marginLeft: theme.spacing[2],
  },
  progressContainer: {
    gap: theme.spacing[2],
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.accent.primary,
    borderRadius: theme.radius.full,
  },
  progressFillComplete: {
    backgroundColor: theme.colors.semantic.success,
  },
  progressText: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.tertiary,
  },
  programMeta: {
    flexDirection: "row",
    gap: theme.spacing[4],
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
  },
  metaText: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.tertiary,
  },
  programAction: {
    paddingTop: theme.spacing[2],
  },
});

