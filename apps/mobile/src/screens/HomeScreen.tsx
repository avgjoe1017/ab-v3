import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { useDraftStore } from "../state/useDraftStore";
import { useEntitlement } from "../hooks/useEntitlement";
import { getAudioEngine } from "@ab/audio-engine";
import { AppScreen, PrimaryButton, SessionTile, SectionHeader, BottomTabs, MiniPlayer, IconButton, Chip, Card, ScienceCard } from "../components";
import { theme } from "../theme";
import type { TabRoute } from "../components";
import { useActiveProgram } from "../hooks";
import { useOnboardingPreferences } from "../hooks/useOnboardingPreferences";
import { getRandomScienceCard } from "../lib/science";

type SessionRow = { id: string; title: string; goalTag?: string };

export default function HomeScreen({ navigation }: any) {
  const { initializeDraft } = useDraftStore();
  const { entitlement, refreshEntitlement } = useEntitlement();
  const engine = useMemo(() => getAudioEngine(), []);
  const [snapshot, setSnapshot] = useState(() => engine.getState());

  useEffect(() => engine.subscribe((s) => setSnapshot(s)), [engine]);

  useEffect(() => {
    refreshEntitlement();
  }, [refreshEntitlement]);

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      try {
        const res = await apiGet<{ sessions: SessionRow[] }>("/sessions");
        return res.sessions;
      } catch (err) {
        console.error("[HomeScreen] Error fetching sessions:", err);
        throw err;
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: onboardingPrefs } = useOnboardingPreferences();

  const handleSessionPress = (sessionId: string) => {
    navigation.navigate("SessionDetail", { sessionId });
  };

  // Filter sessions based on onboarding goal preference, or fallback to beginner sessions
  const beginnerSessions = useMemo(() => {
    if (isLoading || !sessions) return [];
    if (sessions.length === 0) return [];
    
    // If user has onboarding goal preference, prioritize sessions with that goalTag
    const userGoal = onboardingPrefs?.goal;
    
    if (userGoal) {
      // Filter by user's selected goal
      const goalSessions = sessions.filter(s => s.goalTag === userGoal);
      if (goalSessions.length > 0) {
        return goalSessions;
      }
    }
    
    // Fallback to beginner-friendly sessions
    return sessions.filter(s => {
      return (
        s.goalTag === "beginner" ||
        s.goalTag === "anxiety" ||
        s.goalTag === "resilience" ||
        s.goalTag === "productivity" ||
        (s.title && s.title.toUpperCase().includes("EASE IN")) ||
        (s.title && s.title.toUpperCase().includes("CALM DOWN")) ||
        (s.title && s.title.toUpperCase().includes("HARD DAY")) ||
        (s.title && s.title.toUpperCase().includes("NEXT RIGHT THING"))
      );
    });
  }, [sessions, isLoading, onboardingPrefs?.goal]);

  const isPlaying = snapshot.status === "playing" || snapshot.status === "preroll";
  const currentSessionId = snapshot.sessionId;
  const { data: activeProgram } = useActiveProgram();

  // Get a random science card for "Did you know?" section
  const scienceCard = useMemo(() => getRandomScienceCard(), []);

  const handleBeginPress = () => {
    if (!sessions || sessions.length === 0) {
      console.warn("[HomeScreen] No sessions loaded yet");
      return;
    }
    
    // Use first available session as default
    const firstSession = sessions[0];
    if (firstSession) {
      handleSessionPress(firstSession.id);
    }
  };

  const handleNavigate = (route: TabRoute) => {
    switch (route) {
      case "Today":
        // Already on Today
        break;
      case "Explore":
        navigation.navigate("Explore");
        break;
      case "Programs":
        navigation.navigate("ProgramsList");
        break;
      case "Library":
        navigation.navigate("Library");
        break;
    }
  };

  const handleMiniPlayerPress = () => {
    if (currentSessionId) {
      navigation.navigate("Player", { sessionId: currentSessionId });
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
          <View style={styles.headerLeft}>
            <Text style={styles.headerGreeting}>Good evening, Joe.</Text>
            <Text style={styles.headerSubtext}>Time to unwind</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>Day 12</Text>
            </View>
            <IconButton
              icon="account-circle"
              onPress={() => navigation.navigate("Settings")}
              variant="filled"
            />
          </View>
        </View>

        {/* Active Program Prompt */}
        {activeProgram && (
          <View style={styles.programPromptContainer}>
            <Card
              variant="elevated"
              onPress={() => navigation.navigate("ProgramDetail", { programId: activeProgram.program.id })}
              style={styles.programPromptCard}
            >
              <View style={styles.programPromptContent}>
                <View style={styles.programPromptIconContainer}>
                  <MaterialIcons name="book" size={20} color={theme.colors.accent.primary} />
                </View>
                <View style={styles.programPromptText}>
                  <Text style={styles.programPromptTitle}>Continue {activeProgram.program.title}</Text>
                  <Text style={styles.programPromptSubtitle}>Day {activeProgram.currentDay} of {activeProgram.program.totalDays}</Text>
                </View>
                <MaterialIcons name="arrow-forward" size={20} color={theme.colors.text.tertiary} />
              </View>
            </Card>
          </View>
        )}

        {/* SOS Entry Point */}
        <View style={styles.sosContainer}>
          <Card
            variant="default"
            onPress={() => navigation.navigate("SOS")}
            style={styles.sosCard}
          >
            <View style={styles.sosContent}>
              <View style={styles.sosIconContainer}>
                <MaterialIcons name="emergency" size={20} color={theme.colors.semantic.error} />
              </View>
              <View style={styles.sosText}>
                <Text style={styles.sosTitle}>Need immediate help?</Text>
                <Text style={styles.sosSubtitle}>Quick 2-6 minute sessions</Text>
              </View>
              <MaterialIcons name="arrow-forward" size={20} color={theme.colors.text.tertiary} />
            </View>
          </Card>
        </View>

        {/* Hero Question */}
        <View style={styles.heroQuestionContainer}>
          <Text style={styles.heroQuestion}>What do you need to hear today?</Text>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCardContainer}>
          <LinearGradient
            colors={theme.colors.gradients.surface}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCardBackground}
          >
            <View style={styles.heroCardContent}>
              <View style={styles.heroCardTop}>
                <Chip
                  label="Based on values: Peace, Autonomy"
                  variant="default"
                />
              </View>
              <View style={styles.heroCardInfo}>
                <Text style={styles.heroCardTitle}>Wind Down for Sleep</Text>
                <View style={styles.heroCardMeta}>
                  <MaterialIcons name="waves" size={18} color={theme.colors.text.tertiary} />
                  <Text style={styles.heroCardMetaText}>Deep Rest · Delta 2Hz · 30 min</Text>
                </View>
              </View>
              <View style={styles.heroCardQuote}>
                <Text style={styles.heroCardQuoteText}>
                  "I release what I cannot control. My mind is quiet. My body is safe."
                </Text>
              </View>
              <View style={styles.heroCardActions}>
                <PrimaryButton
                  label="BEGIN"
                  onPress={handleBeginPress}
                  icon="play-arrow"
                  iconPosition="left"
                  variant="gradient"
                  size="md"
                  style={styles.beginButton}
                />
                <View style={styles.differentButton}>
                  <MaterialIcons name="cached" size={18} color={theme.colors.text.tertiary} />
                  <Text style={styles.differentButtonText}>Hear a different affirmation</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Beginner Sessions */}
        {!isLoading && beginnerSessions.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Beginner Affirmations" />
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sessionScroll}
            >
              {beginnerSessions.slice(0, 4).map((session) => {
                let shortTitle = session.title || "";
                const titleUpper = shortTitle.toUpperCase();
                if (titleUpper.includes("EASE IN")) shortTitle = "Ease In";
                else if (titleUpper.includes("CALM DOWN")) shortTitle = "Calm Down";
                else if (titleUpper.includes("HARD DAY")) shortTitle = "Hard Day";
                else if (titleUpper.includes("NEXT RIGHT")) shortTitle = "Next Right Thing";
                
                return (
                  <SessionTile
                    key={session.id}
                    sessionId={session.id}
                    title={shortTitle}
                    goalTag={session.goalTag}
                    onPress={() => handleSessionPress(session.id)}
                    variant="compact"
                  />
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Did You Know? - Science Card */}
        <View style={styles.section}>
          <SectionHeader title="Did you know?" />
          <View style={styles.scienceCardContainer}>
            <ScienceCard data={scienceCard} variant="default" />
          </View>
        </View>

        {/* Continue Practice */}
        <View style={styles.section}>
          <SectionHeader title="Continue Practice" />
          {/* TODO: Implement continue practice card */}
        </View>

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Mini Player */}
      <MiniPlayer
        sessionId={currentSessionId}
        onPress={handleMiniPlayerPress}
      />

      {/* Bottom Navigation */}
      <BottomTabs
        activeRoute="Today"
        onNavigate={handleNavigate}
        showBadge={true}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing[6],
    paddingBottom: theme.spacing[2],
  },
  headerLeft: {
    flexDirection: "column",
  },
  headerGreeting: {
    ...theme.typography.styles.h2,
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
  },
  headerSubtext: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing[1],
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
  },
  dayBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.full,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.2)",
  },
  dayBadgeText: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  heroQuestionContainer: {
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[6],
    paddingBottom: theme.spacing[6],
  },
  heroQuestion: {
    ...theme.typography.styles.h1,
    fontSize: theme.typography.fontSize["3xl"],
    textAlign: "center",
    opacity: 0.9,
  },
  heroCardContainer: {
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[10],
  },
  heroCardBackground: {
    width: "100%",
    aspectRatio: 4 / 5,
    maxHeight: 520,
    borderRadius: theme.radius["2xl"],
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  heroCardContent: {
    flex: 1,
    padding: theme.spacing[6],
    justifyContent: "space-between",
  },
  heroCardTop: {
    justifyContent: "flex-start",
    paddingTop: theme.spacing[2],
    marginBottom: "auto",
  },
  heroCardInfo: {
    flexDirection: "column",
    gap: theme.spacing[2],
    marginBottom: theme.spacing[6],
  },
  heroCardTitle: {
    ...theme.typography.styles.h1,
    fontSize: theme.typography.fontSize["4xl"],
    color: theme.colors.text.primary,
  },
  heroCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  heroCardMetaText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.tertiary,
  },
  heroCardQuote: {
    marginBottom: theme.spacing[8],
    paddingLeft: 0,
  },
  heroCardQuoteText: {
    ...theme.typography.styles.h3,
    fontSize: theme.typography.fontSize.xl,
    fontStyle: "italic",
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  heroCardActions: {
    flexDirection: "column",
    gap: theme.spacing[4],
  },
  beginButton: {
    width: "100%",
  },
  differentButton: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing[2],
    paddingVertical: theme.spacing[1],
  },
  differentButtonText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.tertiary,
  },
  section: {
    marginBottom: theme.spacing[10],
  },
  sessionScroll: {
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[4],
    gap: theme.spacing[3],
  },
  programPromptContainer: {
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[2],
  },
  programPromptCard: {
    padding: theme.spacing[3],
  },
  programPromptContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
  },
  programPromptIconContainer: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.md,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  programPromptText: {
    flex: 1,
    gap: theme.spacing[0],
  },
  programPromptTitle: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  programPromptSubtitle: {
    ...theme.typography.styles.caption,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  sosContainer: {
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[2],
  },
  sosCard: {
    padding: theme.spacing[3],
  },
  sosContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
  },
  sosIconContainer: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.md,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  sosText: {
    flex: 1,
    gap: theme.spacing[0],
  },
  sosTitle: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  sosSubtitle: {
    ...theme.typography.styles.caption,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  scienceCardContainer: {
    paddingHorizontal: theme.spacing[6],
  },
});
