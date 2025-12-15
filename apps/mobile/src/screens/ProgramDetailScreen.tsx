import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { AppScreen, SectionHeader, IconButton, Card, PrimaryButton } from "../components";
import { theme } from "../theme";
import { PLACEHOLDER_PROGRAMS, type Program } from "../types/program";
import { getCurrentDay, isDayCompleted, markDayCompleted } from "../storage/programProgress";

export default function ProgramDetailScreen({ route, navigation }: any) {
  const programId: string = route.params.programId;
  
  // Find program (for now using placeholder, should come from API)
  const program = useMemo(() => {
    return PLACEHOLDER_PROGRAMS.find(p => p.id === programId);
  }, [programId]);

  const { data: currentDay } = useQuery({
    queryKey: ["program-current-day", programId],
    queryFn: async () => {
      if (!program) return 1;
      return getCurrentDay(programId, program.totalDays);
    },
    enabled: !!program,
  });

  if (!program) {
    return (
      <AppScreen>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Program not found</Text>
        </View>
      </AppScreen>
    );
  }

  const handleDayPress = async (day: Program["days"][0]) => {
    // Navigate to player for this day's session
    navigation.navigate("Player", { sessionId: day.sessionId });
  };

  const handleStartContinue = () => {
    const dayToStart = currentDay ?? 1;
    const day = program.days.find(d => d.day === dayToStart);
    if (day) {
      handleDayPress(day);
    }
  };

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
          <View style={styles.headerSpacer} />
        </View>

        {/* Program Info */}
        <View style={styles.programInfo}>
          <Text style={styles.programTitle}>{program.title}</Text>
          <Text style={styles.programDescription}>{program.description}</Text>
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
        </View>

        {/* Start/Continue Button */}
        <View style={styles.actionContainer}>
          <PrimaryButton
            label={currentDay && currentDay > 1 ? `Continue Day ${currentDay}` : "Start Program"}
            onPress={handleStartContinue}
            variant="gradient"
            size="lg"
            icon="play-arrow"
            iconPosition="left"
          />
        </View>

        {/* Days List */}
        <View style={styles.daysSection}>
          <SectionHeader title="Daily Sessions" />
          <View style={styles.daysList}>
            {program.days.map((day) => (
              <DayCard
                key={day.day}
                day={day}
                currentDay={currentDay ?? 1}
                programId={programId}
                onPress={() => handleDayPress(day)}
              />
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </AppScreen>
  );
}

interface DayCardProps {
  day: Program["days"][0];
  currentDay: number;
  programId: string;
  onPress: () => void;
}

function DayCard({ day, currentDay, programId, onPress }: DayCardProps) {
  const { data: completed } = useQuery({
    queryKey: ["day-completed", programId, day.day],
    queryFn: async () => {
      return isDayCompleted(programId, day.day);
    },
  });

  const isCurrent = day.day === currentDay;
  const isCompleted = completed ?? false;
  const isUpcoming = day.day > currentDay;

  return (
    <Card
      variant={isCurrent ? "elevated" : "default"}
      onPress={onPress}
      style={StyleSheet.flatten([
        styles.dayCard,
        isCurrent && styles.dayCardCurrent,
        isUpcoming && styles.dayCardUpcoming,
      ])}
    >
      <View style={styles.dayCardContent}>
        <View style={styles.dayCardLeft}>
          <View style={[
            styles.dayNumber,
            isCurrent && styles.dayNumberCurrent,
            isCompleted && styles.dayNumberCompleted,
          ]}>
            <Text style={[
              styles.dayNumberText,
              isCurrent && styles.dayNumberTextCurrent,
              isCompleted && styles.dayNumberTextCompleted,
            ]}>
              {day.day}
            </Text>
          </View>
          <View style={styles.dayInfo}>
            <Text style={[
              styles.dayTitle,
              isUpcoming && styles.dayTitleUpcoming,
            ]}>
              {day.sessionTitle}
            </Text>
            {day.description && (
              <Text style={styles.dayDescription}>{day.description}</Text>
            )}
          </View>
        </View>
        <View style={styles.dayCardRight}>
          {isCompleted && (
            <MaterialIcons name="check-circle" size={24} color={theme.colors.semantic.success} />
          )}
          {isCurrent && !isCompleted && (
            <MaterialIcons name="play-circle-filled" size={24} color={theme.colors.accent.primary} />
          )}
          {isUpcoming && (
            <MaterialIcons name="lock" size={20} color={theme.colors.text.tertiary} />
          )}
        </View>
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
    padding: theme.spacing[6],
    paddingBottom: theme.spacing[4],
  },
  headerSpacer: {
    flex: 1,
  },
  programInfo: {
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[6],
    gap: theme.spacing[3],
  },
  programTitle: {
    ...theme.typography.styles.h1,
    fontSize: theme.typography.fontSize["3xl"],
    color: theme.colors.text.primary,
  },
  programDescription: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.relaxed,
  },
  programMeta: {
    flexDirection: "row",
    gap: theme.spacing[4],
    paddingTop: theme.spacing[2],
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
  actionContainer: {
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[6],
  },
  daysSection: {
    paddingHorizontal: theme.spacing[6],
    gap: theme.spacing[4],
  },
  daysList: {
    gap: theme.spacing[3],
  },
  dayCard: {
    padding: theme.spacing[4],
  },
  dayCardCurrent: {
    borderColor: theme.colors.accent.primary,
    borderWidth: 2,
  },
  dayCardUpcoming: {
    opacity: 0.6,
  },
  dayCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[4],
    flex: 1,
  },
  dayCardRight: {
    marginLeft: theme.spacing[2],
  },
  dayNumber: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.colors.border.default,
  },
  dayNumberCurrent: {
    backgroundColor: theme.colors.accent.primary,
    borderColor: theme.colors.accent.primary,
  },
  dayNumberCompleted: {
    backgroundColor: theme.colors.semantic.success,
    borderColor: theme.colors.semantic.success,
  },
  dayNumberText: {
    ...theme.typography.styles.h3,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  dayNumberTextCurrent: {
    color: theme.colors.background.primary,
  },
  dayNumberTextCompleted: {
    color: theme.colors.background.primary,
  },
  dayInfo: {
    flex: 1,
    gap: theme.spacing[0],
  },
  dayTitle: {
    ...theme.typography.styles.h3,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  dayTitleUpcoming: {
    color: theme.colors.text.tertiary,
  },
  dayDescription: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing[0],
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing[6],
  },
  errorText: {
    ...theme.typography.styles.h2,
    color: theme.colors.semantic.error,
  },
});

