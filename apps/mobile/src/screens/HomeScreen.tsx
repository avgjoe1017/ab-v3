import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { useDraftStore } from "../state/useDraftStore";
import { useEntitlement } from "../hooks/useEntitlement";
import { useAuthToken } from "../lib/auth";
import { getAudioEngine } from "@ab/audio-engine";
import { AppScreen, PrimaryButton, SessionTile, SectionHeader, MiniPlayer, IconButton, Chip, Card, ScienceCard } from "../components";
import { theme } from "../theme";
import { useActiveProgram } from "../hooks";
import { useOnboardingPreferences } from "../hooks/useOnboardingPreferences";
import { getRandomScienceCard } from "../lib/science";
import type { SessionV3 } from "@ab/contracts";
import { getRecentSessions } from "../storage/recentSessions";

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

  const authToken = useAuthToken();
  
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ["sessions", authToken],
    queryFn: async () => {
      try {
        const res = await apiGet<{ sessions: SessionRow[] }>("/sessions", authToken);
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
    navigation.getParent()?.navigate("SessionDetail", { sessionId });
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

  // Fetch recent sessions for Continue Practice
  const { data: recentSessions } = useQuery({
    queryKey: ["recent-sessions"],
    queryFn: getRecentSessions,
  });

  // Get most recent session for Continue Practice
  const continueSession = useMemo(() => {
    if (!recentSessions || recentSessions.length === 0) return null;
    return recentSessions[0]; // Most recent is first
  }, [recentSessions]);

  // Fetch continue session details
  const { data: continueSessionDetails } = useQuery({
    queryKey: ["continue-session", continueSession?.sessionId],
    queryFn: async () => {
      if (!continueSession) return null;
      try {
        const res = await apiGet<SessionV3>(`/sessions/${continueSession.sessionId}`, authToken);
        return res;
      } catch (err) {
        console.error("[HomeScreen] Error fetching continue session:", err);
        return null;
      }
    },
    enabled: !!continueSession,
  });

  // Calculate progress for continue session
  const continueProgress = useMemo(() => {
    if (!continueSession || !continueSessionDetails) return null;
    // Estimate duration (default 30 minutes if not available)
    const estimatedDurationMs = 30 * 60 * 1000; // 30 minutes
    const playedFor = continueSession.playedFor || 0;
    const progress = Math.min(playedFor / estimatedDurationMs, 1);
    const remainingMs = Math.max(estimatedDurationMs - playedFor, 0);
    const remainingMinutes = Math.round(remainingMs / (60 * 1000));
    return { progress, remainingMinutes };
  }, [continueSession, continueSessionDetails]);

  const handleContinuePress = () => {
    if (continueSession) {
      handleSessionPress(continueSession.sessionId);
    }
  };

  // Get a random science card for "Did you know?" section
  const scienceCard = useMemo(() => getRandomScienceCard(), []);

  // Find hero session (prefer sleep-related, fallback to first session)
  const heroSession = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;
    // Try to find a sleep-related session
    const sleepSession = sessions.find(s => 
      s.goalTag === "sleep" || 
      s.title.toLowerCase().includes("sleep") ||
      s.title.toLowerCase().includes("wind down")
    );
    return sleepSession || sessions[0];
  }, [sessions]);

  // Fetch hero session details with affirmations
  const { data: heroSessionDetails } = useQuery({
    queryKey: ["hero-session", heroSession?.id, authToken],
    queryFn: async () => {
      if (!heroSession) return null;
      try {
        const res = await apiGet<SessionV3>(`/sessions/${heroSession.id}`, authToken);
        return res;
      } catch (err) {
        console.error("[HomeScreen] Error fetching hero session:", err);
        return null;
      }
    },
    enabled: !!heroSession,
  });

  // State for current displayed affirmation
  const [currentAffirmation, setCurrentAffirmation] = useState<string | null>(null);

  // Initialize affirmation when session details are loaded
  useEffect(() => {
    if (heroSessionDetails && heroSessionDetails.affirmations.length > 0) {
      // Pick a random affirmation on initial load
      const randomIndex = Math.floor(Math.random() * heroSessionDetails.affirmations.length);
      const affirmation = heroSessionDetails.affirmations[randomIndex];
      if (affirmation) {
        setCurrentAffirmation(affirmation);
      }
    }
  }, [heroSessionDetails]);

  const handleDifferentAffirmation = () => {
    if (!heroSessionDetails || heroSessionDetails.affirmations.length === 0) return;
    
    // Pick a different random affirmation
    const availableAffirmations = heroSessionDetails.affirmations.filter(
      a => a !== currentAffirmation
    );
    
    if (availableAffirmations.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableAffirmations.length);
      const affirmation = availableAffirmations[randomIndex];
      if (affirmation) {
        setCurrentAffirmation(affirmation);
      }
    } else {
      // If only one affirmation, just use it
      const affirmation = heroSessionDetails.affirmations[0];
      if (affirmation) {
        setCurrentAffirmation(affirmation);
      }
    }
  };

  const handleBeginPress = () => {
    if (!heroSession) {
      console.warn("[HomeScreen] No hero session available");
      return;
    }
    handleSessionPress(heroSession.id);
  };

  const handleMiniPlayerPress = () => {
    if (currentSessionId) {
      // Navigate to Player screen in the stack
      navigation.getParent()?.navigate("Player", { sessionId: currentSessionId });
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
              onPress={() => navigation.getParent()?.navigate("Settings")}
              variant="filled"
            />
          </View>
        </View>

        {/* Active Program Prompt */}
        {activeProgram && (
          <View style={styles.programPromptContainer}>
            <Card
              variant="elevated"
              onPress={() => navigation.getParent()?.navigate("ProgramDetail", { programId: activeProgram.program.id })}
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
            onPress={() => navigation.getParent()?.navigate("SOS")}
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
                <Text style={styles.heroCardTitle}>
                  {heroSessionDetails?.title || heroSession?.title || "Wind Down for Sleep"}
                </Text>
                <View style={styles.heroCardMeta}>
                  <MaterialIcons name="waves" size={18} color={theme.colors.text.tertiary} />
                  <Text style={styles.heroCardMetaText}>
                    {heroSessionDetails?.brainwaveState 
                      ? `${heroSessionDetails.brainwaveState} ${heroSessionDetails.frequencyHz || ''}Hz`
                      : heroSessionDetails?.goalTag 
                        ? heroSessionDetails.goalTag
                        : "Deep Rest"}
                    {heroSessionDetails?.frequencyHz ? ` · ${heroSessionDetails.frequencyHz}Hz` : ""}
                    {" · 30 min"}
                  </Text>
                </View>
              </View>
              <View style={styles.heroCardQuote}>
                <Text style={styles.heroCardQuoteText}>
                  {currentAffirmation 
                    ? `"${currentAffirmation}"`
                    : heroSessionDetails?.affirmations?.[0]
                      ? `"${heroSessionDetails.affirmations[0]}"`
                      : '"I release what I cannot control. My mind is quiet. My body is safe."'}
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
                <Pressable 
                  style={styles.differentButton}
                  onPress={handleDifferentAffirmation}
                  disabled={!heroSessionDetails || !currentAffirmation}
                >
                  <MaterialIcons name="cached" size={18} color={theme.colors.text.tertiary} />
                  <Text style={styles.differentButtonText}>Hear a different affirmation</Text>
                </Pressable>
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
        {continueSession && continueSessionDetails && continueProgress && (
          <View style={styles.section}>
            <SectionHeader title="Continue Practice" />
            <View style={styles.continueCardContainer}>
              <Card
                variant="default"
                onPress={handleContinuePress}
                style={styles.continueCard}
              >
                <View style={styles.continueContent}>
                  <View style={styles.continueImageContainer}>
                    <LinearGradient
                      colors={theme.colors.gradients.accent}
                      style={styles.continueImage}
                    >
                      <View style={styles.continueImageOverlay}>
                        <MaterialIcons name="play-circle" size={24} color={theme.colors.text.primary} />
                      </View>
                    </LinearGradient>
                  </View>
                  <View style={styles.continueInfo}>
                    <View style={styles.continueHeader}>
                      <Text style={styles.continueTitle} numberOfLines={1}>
                        {continueSessionDetails.title}
                      </Text>
                      {continueProgress.remainingMinutes > 0 && (
                        <Text style={styles.continueTimeLeft}>
                          {continueProgress.remainingMinutes}m left
                        </Text>
                      )}
                    </View>
                    <View style={styles.continueProgressBar}>
                      <View 
                        style={[
                          styles.continueProgressFill,
                          { width: `${continueProgress.progress * 100}%` }
                        ]} 
                      />
                    </View>
                  </View>
                  <Pressable
                    style={styles.continuePlayButton}
                    onPress={handleContinuePress}
                  >
                    <MaterialIcons name="play-arrow" size={24} color={theme.colors.text.primary} />
                  </Pressable>
                </View>
              </Card>
            </View>
          </View>
        )}

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Mini Player */}
      <MiniPlayer
        sessionId={currentSessionId}
        onPress={handleMiniPlayerPress}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Reduced since tab bar is now persistent and handled by navigator
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
    ...theme.typography.styles.sectionHeading,
    textAlign: "center",
    opacity: 0.9,
    fontStyle: "italic",
    // TODO: Use Lora serif font when custom fonts are implemented
    // Design inspiration uses Lora italic for this text
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
    ...theme.typography.styles.cardTitle,
  },
  heroCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  heroCardMetaText: {
    ...theme.typography.styles.metadata,
  },
  heroCardQuote: {
    marginBottom: theme.spacing[8],
    paddingLeft: 0,
  },
  heroCardQuoteText: {
    ...theme.typography.styles.affirmationTitle,
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
    opacity: 1,
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
  continueCardContainer: {
    paddingHorizontal: theme.spacing[6],
  },
  continueCard: {
    padding: theme.spacing[4],
  },
  continueContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[4],
  },
  continueImageContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  continueImage: {
    width: "100%",
    height: "100%",
  },
  continueImageOverlay: {
    position: "absolute",
    inset: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  continueInfo: {
    flex: 1,
    minWidth: 0,
    gap: theme.spacing[1],
  },
  continueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: theme.spacing[1],
  },
  continueTitle: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  continueTimeLeft: {
    ...theme.typography.styles.caption,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginLeft: theme.spacing[2],
  },
  continueProgressBar: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: theme.radius.full,
    overflow: "hidden",
  },
  continueProgressFill: {
    height: "100%",
    backgroundColor: theme.colors.accent.primary,
    borderRadius: theme.radius.full,
  },
  continuePlayButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
});
