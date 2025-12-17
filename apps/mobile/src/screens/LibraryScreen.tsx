import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { AppScreen, SectionHeader, IconButton, Chip, SessionTile, Card, PrimaryButton } from "../components";
import { theme } from "../theme";
import { getSavedSessions, toggleSavedSession } from "../storage/savedSessions";
import { getRecentSessions, clearRecentSessions } from "../storage/recentSessions";
import { getMixPresets, deleteMixPreset } from "../storage/mixPresets";
import { getAudioEngine } from "@ab/audio-engine";
import type { Mix } from "@ab/audio-engine";

type SessionRow = { id: string; title: string; goalTag?: string };

type LibraryTab = "Saved" | "Recent" | "My Mixes";

export default function LibraryScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<LibraryTab>("Saved");
  const queryClient = useQueryClient();

  // Fetch all sessions for Saved tab
  const { data: allSessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await apiGet<{ sessions: SessionRow[] }>("/sessions");
      return res.sessions;
    },
  });

  // Fetch saved sessions
  const { data: savedSessionIds, refetch: refetchSaved } = useQuery({
    queryKey: ["saved-sessions"],
    queryFn: getSavedSessions,
  });

  // Fetch recent sessions
  const { data: recentSessions, refetch: refetchRecent } = useQuery({
    queryKey: ["recent-sessions"],
    queryFn: getRecentSessions,
  });

  // Fetch mix presets
  const { data: mixPresets, refetch: refetchPresets } = useQuery({
    queryKey: ["mix-presets"],
    queryFn: getMixPresets,
  });

  // Filter saved sessions
  const savedSessions = useMemo(() => {
    if (!allSessions || !savedSessionIds) return [];
    return allSessions.filter(s => savedSessionIds.includes(s.id));
  }, [allSessions, savedSessionIds]);

  // Get recent session details
  const recentSessionsWithDetails = useMemo(() => {
    if (!allSessions || !recentSessions) return [];
    return recentSessions
      .map(recent => {
        const session = allSessions.find(s => s.id === recent.sessionId);
        return session ? { ...session, playedAt: recent.playedAt } : null;
      })
      .filter((s): s is SessionRow & { playedAt: string } => s !== null);
  }, [allSessions, recentSessions]);

  const handleTabPress = (tab: LibraryTab) => {
    setActiveTab(tab);
  };

  const handleSessionPress = (sessionId: string) => {
    navigation.getParent()?.navigate("SessionDetail", { sessionId });
  };

  const handleToggleSaved = async (sessionId: string) => {
    await toggleSavedSession(sessionId);
    queryClient.invalidateQueries({ queryKey: ["saved-sessions"] });
  };

  const handleClearRecent = async () => {
    await clearRecentSessions();
    queryClient.invalidateQueries({ queryKey: ["recent-sessions"] });
  };

  const handleDeletePreset = async (presetId: string) => {
    await deleteMixPreset(presetId);
    queryClient.invalidateQueries({ queryKey: ["mix-presets"] });
  };

  const handleApplyPreset = (preset: NonNullable<typeof mixPresets>[0]) => {
    const engine = getAudioEngine();
    engine.setMix(preset.mix);
    // Navigate to player if there's a current session
    const snapshot = engine.getState();
    if (snapshot.sessionId) {
      navigation.getParent()?.navigate("Player", { sessionId: snapshot.sessionId });
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
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Library</Text>
            <Text style={styles.headerSubtitle}>Your saved content and presets</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(["Saved", "Recent", "My Mixes"] as LibraryTab[]).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => handleTabPress(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === "Saved" && (
            <View style={styles.tabContent}>
              {savedSessions.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="bookmark-border" size={48} color={theme.colors.text.tertiary} />
                  <Text style={styles.emptyStateTitle}>No saved sessions</Text>
                  <Text style={styles.emptyStateText}>
                    Tap the bookmark icon on any session to save it here
                  </Text>
                </View>
              ) : (
                <View style={styles.sessionsList}>
                  {savedSessions.map((session) => (
                    <SessionTile
                      key={session.id}
                      sessionId={session.id}
                      title={session.title}
                      goalTag={session.goalTag}
                      onPress={() => handleSessionPress(session.id)}
                      onToggleSaved={() => handleToggleSaved(session.id)}
                      isSaved={true}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === "Recent" && (
            <View style={styles.tabContent}>
              {recentSessionsWithDetails.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="history" size={48} color={theme.colors.text.tertiary} />
                  <Text style={styles.emptyStateTitle}>No recent sessions</Text>
                  <Text style={styles.emptyStateText}>
                    Sessions you've played will appear here
                  </Text>
                </View>
              ) : (
                <>
                  {recentSessionsWithDetails.length > 0 && (
                    <View style={styles.clearButtonContainer}>
                      <Pressable onPress={handleClearRecent} style={styles.clearButton}>
                        <Text style={styles.clearButtonText}>Clear History</Text>
                      </Pressable>
                    </View>
                  )}
                  <View style={styles.sessionsList}>
                    {recentSessionsWithDetails.map((session) => (
                      <SessionTile
                        key={session.id}
                        sessionId={session.id}
                        title={session.title}
                        goalTag={session.goalTag}
                        onPress={() => handleSessionPress(session.id)}
                        onToggleSaved={() => handleToggleSaved(session.id)}
                        isSaved={savedSessionIds?.includes(session.id) ?? false}
                        variant="default"
                      />
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

          {activeTab === "My Mixes" && (
            <View style={styles.tabContent}>
              {mixPresets && mixPresets.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="tune" size={48} color={theme.colors.text.tertiary} />
                  <Text style={styles.emptyStateTitle}>No mix presets</Text>
                  <Text style={styles.emptyStateText}>
                    Save your current mix settings from the Player screen
                  </Text>
                </View>
              ) : (
                <View style={styles.presetsList}>
                  {mixPresets?.map((preset) => (
                    <Card key={preset.id} variant="default" style={styles.presetCard}>
                      <View style={styles.presetHeader}>
                        <View style={styles.presetInfo}>
                          <Text style={styles.presetName}>{preset.name}</Text>
                          <Text style={styles.presetMix}>
                            Affirmations: {Math.round(preset.mix.affirmations * 100)}% • 
                            Binaural: {Math.round(preset.mix.binaural * 100)}% • 
                            Atmosphere: {Math.round(preset.mix.background * 100)}%
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => handleDeletePreset(preset.id)}
                          style={styles.deleteButton}
                        >
                          <MaterialIcons name="delete-outline" size={20} color={theme.colors.semantic.error} />
                        </Pressable>
                      </View>
                      <PrimaryButton
                        label="Apply"
                        onPress={() => handleApplyPreset(preset)}
                        variant="primary"
                        size="sm"
                        style={styles.applyButton}
                      />
                    </Card>
                  ))}
                </View>
              )}
            </View>
          )}
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
  tabs: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[4],
    gap: theme.spacing[2],
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background.surface,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  tabActive: {
    backgroundColor: theme.colors.background.surfaceElevated,
    borderColor: theme.colors.accent.primary,
  },
  tabText: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  tabTextActive: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    paddingHorizontal: theme.spacing[6],
  },
  sessionsList: {
    gap: theme.spacing[3],
  },
  presetsList: {
    gap: theme.spacing[4],
  },
  presetCard: {
    gap: theme.spacing[3],
  },
  presetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  presetInfo: {
    flex: 1,
    gap: theme.spacing[1],
  },
  presetName: {
    ...theme.typography.styles.h3,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  presetMix: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.tertiary,
  },
  deleteButton: {
    padding: theme.spacing[2],
    marginLeft: theme.spacing[2],
  },
  applyButton: {
    alignSelf: "flex-start",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing[12],
    gap: theme.spacing[3],
  },
  emptyStateTitle: {
    ...theme.typography.styles.h3,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
  },
  emptyStateText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.tertiary,
    textAlign: "center",
    paddingHorizontal: theme.spacing[6],
  },
  clearButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: theme.spacing[3],
  },
  clearButton: {
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
  },
  clearButtonText: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.semantic.error,
  },
});

