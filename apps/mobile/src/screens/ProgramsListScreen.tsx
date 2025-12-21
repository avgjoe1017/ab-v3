import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AppScreen, SectionHeader, IconButton, Card, PrimaryButton, DuotoneCard, type DuotonePalette } from "../components";
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
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Programs</Text>
            <Text style={styles.headerSubtitle}>Structured journeys, one day at a time</Text>
          </View>
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
              onPress={() => navigation.getParent()?.navigate("ProgramDetail", { programId: program.id })}
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

// Map goal tags to palettes and icons
function getProgramPalette(goalTag?: string): DuotonePalette {
  switch (goalTag?.toLowerCase()) {
    case "sleep": return "twilight";
    case "calm": return "sage";
    case "confidence": return "honey";
    case "focus": return "lavender";
    case "anxiety": return "sky";
    default: return "mist";
  }
}

function getProgramIcon(goalTag?: string): keyof typeof MaterialIcons.glyphMap {
  switch (goalTag?.toLowerCase()) {
    case "sleep": return "bedtime";
    case "calm": return "self-improvement";
    case "confidence": return "bolt";
    case "focus": return "psychology";
    case "anxiety": return "spa";
    default: return "auto-awesome";
  }
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
  const palette = getProgramPalette(program.goalTag);
  const icon = getProgramIcon(program.goalTag);

  return (
    <View style={styles.programCardContainer}>
      <DuotoneCard
        title={program.title}
        subtitle={program.description}
        icon={icon}
        palette={palette}
        height={160}
        iconSize={200}
        onPress={onPress}
      >
        <View style={styles.programCardContent}>
          <View style={styles.programCardTop}>
            {isComplete && (
              <View style={styles.completeBadge}>
                <MaterialIcons name="check-circle" size={16} color="#ffffff" />
                <Text style={styles.completeBadgeText}>Complete</Text>
              </View>
            )}
            <View style={styles.daysBadge}>
              <Text style={styles.daysBadgeText}>{program.totalDays} days</Text>
            </View>
          </View>
          
          <View style={styles.programCardBottom}>
            <View style={styles.programCardInfo}>
              <Text style={styles.programCardTitle}>{program.title}</Text>
              <Text style={styles.programCardDescription} numberOfLines={2}>
                {program.description}
              </Text>
            </View>
            
            {/* Progress indicator */}
            {isStarted && !isComplete && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${completionPercent}%` }]} />
                </View>
                <Text style={styles.progressText}>{completionPercent}%</Text>
              </View>
            )}
          </View>
        </View>
      </DuotoneCard>
    </View>
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
  programCardContainer: {
    width: "100%",
  },
  programCardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  programCardTop: {
    flexDirection: "row",
    gap: theme.spacing[2],
  },
  programCardBottom: {
    gap: theme.spacing[2],
  },
  programCardInfo: {
    gap: theme.spacing[1],
  },
  programCardTitle: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  programCardDescription: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 18,
  },
  completeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: theme.radius.full,
  },
  completeBadgeText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: "#ffffff",
    fontWeight: "500",
  },
  daysBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: theme.radius.full,
  },
  daysBadgeText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: "#ffffff",
    fontWeight: "500",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: theme.radius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: theme.radius.full,
  },
  progressText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
});

