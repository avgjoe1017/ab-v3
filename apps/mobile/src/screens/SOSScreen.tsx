import React, { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { getAudioEngine } from "@ab/audio-engine";
import { AppScreen, SessionTile, SectionHeader, MiniPlayer, IconButton, Card } from "../components";
import { theme } from "../theme";

type SessionRow = { id: string; title: string; goalTag?: string };

interface SOSSession {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}

// Placeholder SOS sessions - these should be replaced with real sessions from the API
// that have goalTag="sos" or source="sos"
const PLACEHOLDER_SOS_SESSIONS: SOSSession[] = [
  {
    id: "sos-1",
    title: "Racing Thoughts",
    description: "Slow down your mind",
    icon: "speed",
    color: "#a855f7",
  },
  {
    id: "sos-2",
    title: "Panic Spike",
    description: "Ground yourself quickly",
    icon: "emergency",
    color: "#ef4444",
  },
  {
    id: "sos-3",
    title: "Can't Sleep",
    description: "Gentle rest for body and mind",
    icon: "bedtime",
    color: "#3b82f6",
  },
  {
    id: "sos-4",
    title: "Social Anxiety",
    description: "Feel calm and confident",
    icon: "people",
    color: "#14b8a6",
  },
  {
    id: "sos-5",
    title: "Overwhelm",
    description: "One thing at a time",
    icon: "water-drop",
    color: "#6366f1",
  },
  {
    id: "sos-6",
    title: "Reset",
    description: "Start fresh, right now",
    icon: "refresh",
    color: "#f97316",
  },
];

export default function SOSScreen({ navigation }: any) {
  const engine = useMemo(() => getAudioEngine(), []);
  const [snapshot, setSnapshot] = useState(() => engine.getState());
  useEffect(() => engine.subscribe((s) => setSnapshot(s)), [engine]);

  // Fetch sessions to find SOS sessions
  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await apiGet<{ sessions: SessionRow[] }>("/sessions");
      return res.sessions;
    },
  });

  // Filter for SOS sessions (goalTag === "sos" or use placeholder if none found)
  const sosSessions = useMemo(() => {
    if (sessions) {
      const filtered = sessions.filter(s => s.goalTag === "sos");
      if (filtered.length > 0) {
        return filtered.map(s => ({
          id: s.id,
          title: s.title,
          description: getDescriptionForTitle(s.title),
          icon: getIconForTitle(s.title) as keyof typeof MaterialIcons.glyphMap,
          color: getColorForTitle(s.title),
        }));
      }
    }
    // Use placeholder sessions if no SOS sessions found
    return PLACEHOLDER_SOS_SESSIONS;
  }, [sessions]);

  const currentSessionId = snapshot.sessionId;

  const handleSessionPress = (sessionId: string) => {
    // If using placeholder, show message that real sessions need to be created
    if (sessionId.startsWith("sos-")) {
      // For now, use first available real session as fallback
      const firstSession = sessions?.[0];
      if (firstSession) {
        navigation.navigate("SessionDetail", { sessionId: firstSession.id });
      }
    } else {
      navigation.navigate("SessionDetail", { sessionId });
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
          <IconButton
            icon="arrow-back"
            onPress={() => navigation.goBack()}
            variant="filled"
          />
          <View style={styles.headerCenter}>
            <View style={styles.sosBadge}>
              <MaterialIcons name="emergency" size={20} color={theme.colors.semantic.error} />
              <Text style={styles.sosBadgeText}>SOS</Text>
            </View>
            <Text style={styles.headerTitle}>Quick Help</Text>
            <Text style={styles.headerSubtitle}>2-6 minute sessions for immediate relief</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Intro Text */}
        <View style={styles.intro}>
          <Text style={styles.introText}>
            Choose a session that matches how you're feeling right now. These short sessions are designed to help quickly.
          </Text>
        </View>

        {/* SOS Sessions Grid */}
        <View style={styles.sessionsGrid}>
          {sosSessions.map((session) => (
            <Card
              key={session.id}
              variant="elevated"
              onPress={() => handleSessionPress(session.id)}
              style={styles.sessionCard}
            >
              <View style={[styles.sessionIconContainer, { backgroundColor: `${session.color}20` }]}>
                <MaterialIcons name={session.icon} size={32} color={session.color} />
              </View>
              <View style={styles.sessionContent}>
                <Text style={styles.sessionTitle}>{session.title}</Text>
                <Text style={styles.sessionDescription}>{session.description}</Text>
                <View style={styles.sessionBadge}>
                  <MaterialIcons name="schedule" size={14} color={theme.colors.text.tertiary} />
                  <Text style={styles.sessionBadgeText}>2-6 min</Text>
                </View>
              </View>
              <MaterialIcons
                name="play-arrow"
                size={24}
                color={session.color}
              />
            </Card>
          ))}
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

// Helper functions for placeholder sessions
function getDescriptionForTitle(title: string): string {
  const titleLower = title.toLowerCase();
  if (titleLower.includes("racing") || titleLower.includes("thought")) return "Slow down your mind";
  if (titleLower.includes("panic")) return "Ground yourself quickly";
  if (titleLower.includes("sleep")) return "Gentle rest for body and mind";
  if (titleLower.includes("social") || titleLower.includes("anxiety")) return "Feel calm and confident";
  if (titleLower.includes("overwhelm")) return "One thing at a time";
  if (titleLower.includes("reset")) return "Start fresh, right now";
  return "Quick relief";
}

function getIconForTitle(title: string): string {
  const titleLower = title.toLowerCase();
  if (titleLower.includes("racing") || titleLower.includes("thought")) return "speed";
  if (titleLower.includes("panic")) return "emergency";
  if (titleLower.includes("sleep")) return "bedtime";
  if (titleLower.includes("social") || titleLower.includes("anxiety")) return "people";
  if (titleLower.includes("overwhelm")) return "water-drop";
  if (titleLower.includes("reset")) return "refresh";
  return "self-improvement";
}

function getColorForTitle(title: string): string {
  const titleLower = title.toLowerCase();
  if (titleLower.includes("racing") || titleLower.includes("thought")) return "#a855f7";
  if (titleLower.includes("panic")) return "#ef4444";
  if (titleLower.includes("sleep")) return "#3b82f6";
  if (titleLower.includes("social") || titleLower.includes("anxiety")) return "#14b8a6";
  if (titleLower.includes("overwhelm")) return "#6366f1";
  if (titleLower.includes("reset")) return "#f97316";
  return "#6366f1";
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
    gap: theme.spacing[2],
  },
  headerSpacer: {
    width: 44, // Match IconButton width
  },
  sosBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.full,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: theme.colors.semantic.error,
  },
  sosBadgeText: {
    ...theme.typography.styles.caption,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.semantic.error,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: theme.typography.letterSpacing.wider,
  },
  headerTitle: {
    ...theme.typography.styles.h1,
    fontSize: theme.typography.fontSize["3xl"],
    color: theme.colors.text.primary,
    textAlign: "center",
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
  sessionsGrid: {
    paddingHorizontal: theme.spacing[6],
    gap: theme.spacing[4],
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[4],
    padding: theme.spacing[4],
  },
  sessionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionContent: {
    flex: 1,
    gap: theme.spacing[1],
  },
  sessionTitle: {
    ...theme.typography.styles.h3,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  sessionDescription: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.tertiary,
  },
  sessionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
    marginTop: theme.spacing[1],
  },
  sessionBadgeText: {
    ...theme.typography.styles.caption,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
});

