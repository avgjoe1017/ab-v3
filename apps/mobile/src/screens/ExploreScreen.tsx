import React, { useState, useMemo, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { AppScreen, Chip, SectionHeader, MiniPlayer, Card } from "../components";
import { theme } from "../theme";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { getAudioEngine } from "@ab/audio-engine";

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

  const recommendedSessions = sessions?.slice(0, 3) || [];
  const goalCards = [
    { id: "1", title: "Sleep Better", subtitle: "Delta waves", icon: "bedtime" as const, color: "#3b82f6" },
    { id: "2", title: "Focus", subtitle: "Alpha waves", icon: "psychology" as const, color: "#a855f7" },
    { id: "3", title: "Reduce Anxiety", subtitle: "Theta waves", icon: "self-improvement" as const, color: "#14b8a6" },
    { id: "4", title: "Energy Boost", subtitle: "Gamma waves", icon: "bolt" as const, color: "#f97316" },
  ];

  const newArrivals = sessions?.slice(3, 5) || [];

  const handleSessionPress = (sessionId: string) => {
    navigation.getParent()?.navigate("SessionDetail", { sessionId });
  };

  const handleMiniPlayerPress = () => {
    if (currentSessionId) {
      navigation.getParent()?.navigate("Player", { sessionId: currentSessionId });
    }
  };

  return (
    <AppScreen gradient={false} backgroundColor={theme.colors.background.primary}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Explore</Text>
            <Pressable style={styles.profileButton}>
              <LinearGradient
                colors={theme.colors.gradients.profile}
                style={styles.profileImage}
              />
            </Pressable>
          </View>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color={theme.colors.text.tertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search sessions, goals, or moods..."
              placeholderTextColor={theme.colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
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

        {/* Daily Pick */}
        <View style={styles.section}>
          <SectionHeader title="Daily Pick" />
          <Pressable 
            style={styles.dailyPickCard}
            onPress={() => {
              const firstSession = recommendedSessions[0];
              if (firstSession) {
                handleSessionPress(firstSession.id);
              }
            }}
          >
            <LinearGradient
              colors={theme.colors.gradients.accent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dailyPickImage}
            >
              <LinearGradient
                colors={["rgba(0, 0, 0, 0.8)", "rgba(0, 0, 0, 0.2)", "transparent"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.dailyPickContent}>
                <View style={styles.dailyPickBadges}>
                  <View style={styles.dailyPickBadgePrimary}>
                    <Text style={styles.dailyPickBadgeText}>Deep Focus</Text>
                  </View>
                  <View style={styles.dailyPickBadgeSecondary}>
                    <MaterialIcons name="schedule" size={14} color="#fff" />
                    <Text style={styles.dailyPickBadgeText}>45 min</Text>
                  </View>
                </View>
                <Text style={styles.dailyPickTitle}>Theta Waves for Clarity</Text>
                <Text style={styles.dailyPickDescription} numberOfLines={2}>
                  Enhanced concentration through low-frequency binaural beats. Perfect for studying or deep work.
                </Text>
                <Pressable 
                  style={styles.dailyPickButton}
                  onPress={() => {
                    const firstSession = recommendedSessions[0];
                    if (firstSession) {
                      handleSessionPress(firstSession.id);
                    }
                  }}
                >
                  <MaterialIcons name="play-arrow" size={20} color="#fff" />
                  <Text style={styles.dailyPickButtonText}>Play Session</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Recommended for You */}
        <View style={styles.section}>
          <SectionHeader title="Recommended for You" actionLabel="See All" />
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendedScroll}
          >
            {recommendedSessions.map((session) => (
              <Card
                key={session.id}
                variant="surface"
                onPress={() => handleSessionPress(session.id)}
                style={styles.recommendedCard}
              >
                <View style={styles.recommendedImageContainer}>
                  <LinearGradient
                    colors={theme.colors.gradients.accent}
                    style={styles.recommendedImage}
                  >
                    <View style={styles.recommendedPlayOverlay}>
                      <View style={styles.recommendedPlayButton}>
                        <MaterialIcons name="play-arrow" size={24} color="#fff" />
                      </View>
                    </View>
                  </LinearGradient>
                </View>
                <View style={styles.recommendedInfo}>
                  <Text style={styles.recommendedTitle}>{session.title}</Text>
                  <Text style={styles.recommendedSubtitle}>{session.goalTag || "Session"}</Text>
                </View>
              </Card>
            ))}
          </ScrollView>
        </View>

        {/* Browse by Goal */}
        <View style={styles.section}>
          <SectionHeader title="Browse by Goal" />
          <View style={styles.goalsGrid}>
            {goalCards.map((goal) => (
              <Card key={goal.id} variant="surface" style={styles.goalCard}>
                <View style={[styles.goalIconContainer, { backgroundColor: `${goal.color}1A` }]}>
                  <MaterialIcons name={goal.icon} size={24} color={goal.color} />
                </View>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalSubtitle}>{goal.subtitle}</Text>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* New Arrivals */}
        <View style={styles.section}>
          <SectionHeader title="New Arrivals" />
          <View style={styles.newArrivalsList}>
            {newArrivals.map((item) => (
              <Card
                key={item.id}
                variant="surface"
                onPress={() => handleSessionPress(item.id)}
                style={styles.newArrivalItem}
              >
                <View style={styles.newArrivalImageContainer}>
                  <LinearGradient
                    colors={theme.colors.gradients.accent}
                    style={styles.newArrivalImage}
                  >
                    <View style={styles.newArrivalPlayOverlay}>
                      <MaterialIcons name="play-arrow" size={16} color="#fff" />
                    </View>
                  </LinearGradient>
                </View>
                <View style={styles.newArrivalInfo}>
                  <Text style={styles.newArrivalTitle}>{item.title}</Text>
                  <Text style={styles.newArrivalSubtitle}>{item.goalTag || "Session"}</Text>
                </View>
                <Pressable style={styles.newArrivalAddButton}>
                  <MaterialIcons name="add" size={18} color={theme.colors.text.tertiary} />
                </Pressable>
              </Card>
            ))}
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

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Tab bar is persistent
  },
  header: {
    flexDirection: "column",
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[12],
    paddingBottom: theme.spacing[4],
    backgroundColor: `${theme.colors.background.primary}CC`, // 80% opacity
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing[4],
  },
  headerTitle: {
    ...theme.typography.styles.h1,
    fontSize: theme.typography.fontSize["3xl"],
    color: theme.colors.text.primary,
  },
  profileButton: {
    width: 40,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.full,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  searchContainer: {
    position: "relative",
    width: "100%",
  },
  searchIcon: {
    position: "absolute",
    left: theme.spacing[4],
    top: 14,
    zIndex: 1,
    color: theme.colors.text.tertiary,
  },
  searchInput: {
    width: "100%",
    padding: theme.spacing[3],
    paddingLeft: 44,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.radius.full,
    borderWidth: 0,
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
  dailyPickCard: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
  },
  dailyPickImage: {
    width: "100%",
    height: "100%",
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
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    backgroundColor: theme.colors.accent.primary,
    borderRadius: theme.radius.sm,
  },
  dailyPickBadgeSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: theme.radius.sm,
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
    color: "rgba(255, 255, 255, 0.7)",
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
    height: 40,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  dailyPickButtonText: {
    color: "#fff",
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  recommendedScroll: {
    paddingRight: theme.spacing[6],
    gap: theme.spacing[4],
  },
  recommendedCard: {
    width: 160,
    flexDirection: "column",
    gap: theme.spacing[2],
    padding: 0,
  },
  recommendedImageContainer: {
    width: 160,
    height: 160,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    backgroundColor: "#2d1b2d",
  },
  recommendedImage: {
    width: "100%",
    height: "100%",
  },
  recommendedPlayOverlay: {
    position: "absolute",
    inset: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
  },
  recommendedPlayButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  recommendedInfo: {
    flexDirection: "column",
    gap: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
    paddingBottom: theme.spacing[2],
  },
  recommendedTitle: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  recommendedSubtitle: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.tertiary,
  },
  goalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[4],
    marginTop: theme.spacing[4],
  },
  goalCard: {
    flex: 1,
    minWidth: "45%",
    padding: theme.spacing[4],
    flexDirection: "column",
    gap: theme.spacing[3],
  },
  goalIconContainer: {
    height: 40,
    width: 40,
    borderRadius: theme.radius.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  goalInfo: {
    flexDirection: "column",
  },
  goalTitle: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  goalSubtitle: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing[1],
  },
  newArrivalsList: {
    flexDirection: "column",
    gap: theme.spacing[3],
    marginTop: theme.spacing[3],
  },
  newArrivalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[4],
    padding: theme.spacing[2],
    paddingRight: theme.spacing[4],
  },
  newArrivalImageContainer: {
    height: 56,
    width: 56,
    borderRadius: theme.radius.md,
    overflow: "hidden",
  },
  newArrivalImage: {
    width: "100%",
    height: "100%",
  },
  newArrivalPlayOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
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
  newArrivalAddButton: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
