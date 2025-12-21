import React, { useState, useMemo, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { AppScreen, Chip, SectionHeader, MiniPlayer, DuotoneCard, SessionTile, ExploreHeroDeck, type DuotonePalette, type HeroSession } from "../components";
import { theme } from "../theme";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { getAudioEngine } from "@ab/audio-engine";
import { getUniqueSessionGradients } from "../lib/sessionArt";
import { PLACEHOLDER_PROGRAMS, type Program } from "../types/program";
import { getProgramCompletion } from "../storage/programProgress";

type SessionRow = { id: string; title: string; goalTag?: string };

export default function ExploreScreen({ navigation }: any) {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filters = ["All", "Sleep", "Focus", "Anxiety", "Relaxation"];

  // Audio engine for mini player
  const engine = useMemo(() => getAudioEngine(), []);
  const [snapshot, setSnapshot] = useState(() => engine.getState());
  useEffect(() => engine.subscribe((s) => setSnapshot(s)), [engine]);
  const currentSessionId = snapshot.sessionId;

  // Fetch sessions
  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await apiGet<{ sessions: SessionRow[] }>("/sessions");
      return res.sessions;
    },
  });

  // Get all sessions that will be displayed on this page
  const allDisplayedSessions = sessions?.slice(0, 8) || [];
  
  // Get unique gradients for all sessions (avoids duplicate icons)
  const sessionGradients = useMemo(
    () => getUniqueSessionGradients(allDisplayedSessions),
    [allDisplayedSessions]
  );

  const dailyPickSession = allDisplayedSessions[0];
  const dailyPickGradient = dailyPickSession 
    ? sessionGradients.get(dailyPickSession.id)!
    : { palette: "lavender" as const, colors: ["#b8a8d8", "#a090c0"] as [string, string], iconColor: "#d8c8f0", icon: "psychology" as const };

  // Featured sessions for Hero Deck (4-6 sessions)
  const featuredSessions: HeroSession[] = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];
    const featured = sessions.slice(0, 6).map((s): HeroSession => ({
      id: s.id,
      title: s.title,
      subtitle: `A ${s.goalTag ? s.goalTag.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Session'} session designed to help you find your center.`,
      durationOptions: [15, 20, 30],
      category: s.goalTag ? s.goalTag.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Session',
      intensity: "Medium" as const,
      goalTag: s.goalTag,
    }));
    return featured;
  }, [sessions]);

  const recommendedSessions = allDisplayedSessions.slice(1, 4);
  const newArrivals = allDisplayedSessions.slice(4, 8);

  // Goal cards have their own distinct icons (not from session data)
  const goalCards = [
    { id: "g1", title: "Sleep Better", subtitle: "Delta waves for deep rest", icon: "nights-stay" as const, palette: "twilight" as const },
    { id: "g2", title: "Focus", subtitle: "Alpha waves for clarity", icon: "lightbulb" as const, palette: "lavender" as const },
    { id: "g3", title: "Reduce Anxiety", subtitle: "Theta waves for calm", icon: "spa" as const, palette: "sage" as const },
    { id: "g4", title: "Energy Boost", subtitle: "Gamma waves for vitality", icon: "flash-on" as const, palette: "honey" as const },
  ];

  const handleSessionPress = (sessionId: string) => {
    navigation.getParent()?.navigate("SessionDetail", { sessionId });
  };

  const handleHeroStart = (session: HeroSession) => {
    handleSessionPress(session.id);
  };

  const handleHeroOpenDetails = (session: HeroSession) => {
    handleSessionPress(session.id);
  };

  const handleMiniPlayerPress = () => {
    if (currentSessionId) {
      navigation.getParent()?.navigate("Player", { sessionId: currentSessionId });
    }
  };

  return (
    <AppScreen gradient={true} gradientPreset="calm">
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <Text style={styles.headerGreeting}>Hello, there</Text>
              <Text style={styles.headerSubtitle}>Welcome to Entrain</Text>
            </View>
            <Pressable style={styles.profileButton}>
              <LinearGradient
                colors={["#6c757d", "#495057"]}
                style={styles.profileImage}
              />
            </Pressable>
          </View>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#6c757d" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#adb5bd"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Pressable style={styles.searchFilterButton}>
              <MaterialIcons name="tune" size={18} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        {/* Tag Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {filters.map((filter) => (
            <Chip
              key={filter}
              label={filter}
              onPress={() => setSelectedFilter(filter)}
              active={selectedFilter === filter}
              variant={selectedFilter === filter ? "primary" : "default"}
            />
          ))}
        </ScrollView>

        {/* Hero Sessions Deck */}
        {featuredSessions.length > 0 && (
          <View style={styles.heroDeckSection}>
            <ExploreHeroDeck
              sessions={featuredSessions}
              onStart={handleHeroStart}
              onOpenDetails={handleHeroOpenDetails}
            />
          </View>
        )}

        {/* Recommended for You - Using SessionTile with unique icons */}
        <View style={styles.section}>
          <SectionHeader title="Recommended for You" actionLabel="See All" />
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendedScroll}
          >
            {recommendedSessions.map((session) => {
              const gradient = sessionGradients.get(session.id);
              return (
                <SessionTile
                  key={session.id}
                  sessionId={session.id}
                  title={session.title}
                  goalTag={session.goalTag}
                  icon={gradient?.icon}
                  onPress={() => handleSessionPress(session.id)}
                  variant="default"
                />
              );
            })}
          </ScrollView>
        </View>

        {/* Browse by Goal - Using DuotoneCard */}
        <View style={styles.section}>
          <SectionHeader title="Browse by Goal" />
          <View style={styles.goalsGrid}>
            {goalCards.map((goal) => (
              <View key={goal.id} style={styles.goalCardWrapper}>
                <DuotoneCard
                  title={goal.title}
                  subtitle={goal.subtitle}
                  icon={goal.icon}
                  palette={goal.palette}
                  height={120}
                  showArrow
                  onPress={() => {
                    const goalSessions = sessions?.filter(s => 
                      s.goalTag?.toLowerCase() === goal.title.toLowerCase().replace(' ', '-')
                    );
                    if (goalSessions?.[0]) {
                      handleSessionPress(goalSessions[0].id);
                    }
                  }}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Programs - Horizontal scrolling cards */}
        <View style={styles.section}>
          <SectionHeader title="Programs" actionLabel="See All" />
          <Text style={styles.programsIntro}>
            Follow a structured path with daily sessions
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.programsScroll}
          >
            {PLACEHOLDER_PROGRAMS.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onPress={() => navigation.getParent()?.navigate("ProgramDetail", { programId: program.id })}
              />
            ))}
          </ScrollView>
        </View>

        {/* New Arrivals - Using compact DuotoneCard style */}
        <View style={styles.section}>
          <SectionHeader title="New Arrivals" />
          <View style={styles.newArrivalsList}>
            {newArrivals.map((item) => {
              const itemGradient = sessionGradients.get(item.id)!;
              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.newArrivalItem,
                    pressed && styles.newArrivalPressed,
                  ]}
                  onPress={() => handleSessionPress(item.id)}
                >
                  <View style={styles.newArrivalIconContainer}>
                    <LinearGradient
                      colors={itemGradient.colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.newArrivalIconGradient}
                    >
                      <MaterialIcons
                        name={itemGradient.icon}
                        size={24}
                        color="#fff"
                      />
                    </LinearGradient>
                  </View>
                  <View style={styles.newArrivalInfo}>
                    <Text style={styles.newArrivalTitle}>{item.title}</Text>
                    <Text style={styles.newArrivalSubtitle}>
                      {item.goalTag ? formatGoalTag(item.goalTag) : "Session"}
                    </Text>
                  </View>
                  <View style={styles.newArrivalPlayButton}>
                    <MaterialIcons name="play-arrow" size={18} color={theme.colors.text.primary} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Mini Player */}
      <MiniPlayer
        sessionId={currentSessionId}
        onPress={handleMiniPlayerPress}
      />
    </AppScreen>
  );
}

function formatGoalTag(goalTag: string): string {
  return goalTag
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Program helpers
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
    case "sleep": return "dark-mode";
    case "calm": return "park";
    case "confidence": return "star";
    case "focus": return "center-focus-strong";
    case "anxiety": return "healing";
    default: return "auto-stories";
  }
}

interface ProgramCardProps {
  program: Program;
  onPress: () => void;
}

function ProgramCard({ program, onPress }: ProgramCardProps) {
  const { data: completion } = useQuery({
    queryKey: ["program-completion", program.id],
    queryFn: () => getProgramCompletion(program.id, program.totalDays),
  });

  const completionPercent = completion ?? 0;
  const isStarted = completionPercent > 0;
  const isComplete = completionPercent === 100;
  const palette = getProgramPalette(program.goalTag);
  const icon = getProgramIcon(program.goalTag);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.programCard,
        pressed && styles.programCardPressed,
      ]}
      onPress={onPress}
    >
      <LinearGradient
        colors={
          palette === "twilight" ? ["#8878a8", "#706090"] :
          palette === "sage" ? ["#90b8a8", "#78a090"] :
          palette === "honey" ? ["#d8c090", "#c8a870"] :
          palette === "lavender" ? ["#b8a8d8", "#a090c0"] :
          palette === "sky" ? ["#90a8c8", "#7890b0"] :
          ["#a8a0b8", "#9088a0"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.programCardGradient}
      >
        {/* Decorative icon */}
        <View style={styles.programCardIconBg}>
          <MaterialIcons name={icon} size={100} color="rgba(255,255,255,0.15)" />
        </View>
        
        <View style={styles.programCardContent}>
          {/* Top badges */}
          <View style={styles.programCardBadges}>
            {isComplete && (
              <View style={styles.programCompleteBadge}>
                <MaterialIcons name="check-circle" size={12} color="#fff" />
              </View>
            )}
            <View style={styles.programDaysBadge}>
              <Text style={styles.programDaysBadgeText}>{program.totalDays}d</Text>
            </View>
          </View>
          
          {/* Bottom info */}
          <View style={styles.programCardInfo}>
            <Text style={styles.programCardTitle} numberOfLines={2}>{program.title}</Text>
            {isStarted && !isComplete && (
              <View style={styles.programProgress}>
                <View style={styles.programProgressBar}>
                  <View style={[styles.programProgressFill, { width: `${completionPercent}%` }]} />
                </View>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </Pressable>
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
    flexDirection: "column",
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[12],
    paddingBottom: theme.spacing[4],
    backgroundColor: "transparent",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing[4],
  },
  headerText: {
    flex: 1,
  },
  headerGreeting: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 24,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
    color: "#6c757d",
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#f5f6f7",
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#212529",
    paddingVertical: 0,
  },
  searchFilterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#212529",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  filtersContainer: {
    paddingHorizontal: theme.spacing[6],
    paddingRight: theme.spacing[2],
    paddingBottom: theme.spacing[2],
    gap: theme.spacing[3],
  },
  section: {
    paddingHorizontal: theme.spacing[6],
    marginTop: theme.spacing[6],
  },
  heroDeckSection: {
    paddingHorizontal: 0, // Hero deck handles its own padding
    marginTop: theme.spacing[4],
  },
  // Daily Pick - DuotoneCard style
  dailyPickCard: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: theme.radius.xl,
    overflow: "hidden",
  },
  dailyPickGradient: {
    flex: 1,
    position: "relative",
  },
  dailyPickIconContainer: {
    position: "absolute",
    top: -30,
    right: -40,
    opacity: 0.8,
  },
  dailyPickContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing[5],
    zIndex: 20,
  },
  dailyPickBadges: {
    flexDirection: "row",
    gap: theme.spacing[2],
    marginBottom: theme.spacing[2],
  },
  dailyPickBadgePrimary: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: theme.radius.full,
  },
  dailyPickBadgeSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: theme.radius.full,
  },
  dailyPickBadgeText: {
    ...theme.typography.styles.caption,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: theme.typography.letterSpacing.wider,
  },
  dailyPickTitle: {
    ...theme.typography.styles.h1,
    fontSize: theme.typography.fontSize["2xl"],
    color: "#fff",
    marginBottom: theme.spacing[2],
  },
  dailyPickDescription: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.lineHeight.normal,
    marginBottom: theme.spacing[2],
  },
  dailyPickButton: {
    marginTop: theme.spacing[2],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing[2],
    height: 44,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  dailyPickButtonText: {
    color: "#fff",
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  // Recommended - uses SessionTile
  recommendedScroll: {
    paddingRight: theme.spacing[6],
    gap: theme.spacing[4],
  },
  // Goals Grid - uses DuotoneCard
  goalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[3],
    marginTop: theme.spacing[4],
  },
  goalCardWrapper: {
    width: "48%",
    minWidth: 150,
  },
  // New Arrivals - compact gradient style
  newArrivalsList: {
    flexDirection: "column",
    gap: theme.spacing[3],
    marginTop: theme.spacing[3],
  },
  newArrivalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[4],
    padding: theme.spacing[3],
    backgroundColor: theme.colors.background.surfaceElevated,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.glass,
  },
  newArrivalPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  newArrivalIconContainer: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.md,
    overflow: "hidden",
  },
  newArrivalIconGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  newArrivalInfo: {
    flex: 1,
    minWidth: 0,
  },
  newArrivalTitle: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  newArrivalSubtitle: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing[1],
  },
  newArrivalPlayButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  // Programs section
  programsIntro: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing[3],
  },
  programsScroll: {
    paddingRight: theme.spacing[6],
    gap: theme.spacing[3],
  },
  programCard: {
    width: 160,
    height: 180,
    borderRadius: theme.radius.xl,
    overflow: "hidden",
  },
  programCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  programCardGradient: {
    flex: 1,
    position: "relative",
  },
  programCardIconBg: {
    position: "absolute",
    top: -10,
    right: -20,
  },
  programCardContent: {
    flex: 1,
    padding: theme.spacing[3],
    justifyContent: "space-between",
  },
  programCardBadges: {
    flexDirection: "row",
    gap: theme.spacing[2],
  },
  programCompleteBadge: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.full,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  programDaysBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: theme.radius.full,
  },
  programDaysBadgeText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: "#fff",
    fontWeight: "500",
  },
  programCardInfo: {
    gap: theme.spacing[2],
  },
  programCardTitle: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.fontSize.md,
    fontWeight: "600",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  programProgress: {
    flexDirection: "row",
    alignItems: "center",
  },
  programProgressBar: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: theme.radius.full,
    overflow: "hidden",
  },
  programProgressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: theme.radius.full,
  },
});
