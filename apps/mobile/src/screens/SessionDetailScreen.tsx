import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { SessionV3Schema, type SessionV3 } from "@ab/contracts";
import { AppScreen, IconButton, SectionHeader, PrimaryButton, Chip, Card } from "../components";
import { theme } from "../theme";
import { toggleSavedSession, isSessionSaved } from "../storage/savedSessions";
import { getFrequencyExplanation } from "../lib/science";

export default function SessionDetailScreen({ route, navigation }: any) {
  const sessionId: string = route.params.sessionId;
  const queryClient = useQueryClient();

  // Fetch session details
  const { data: session, isLoading } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const res = await apiGet<any>(`/sessions/${sessionId}`);
      // Validate with schema
      return SessionV3Schema.parse(res);
    },
  });

  // Check if saved
  const { data: isSaved } = useQuery({
    queryKey: ["session-saved", sessionId],
    queryFn: async () => {
      return isSessionSaved(sessionId);
    },
  });

  // Fetch related sessions (sessions with same goalTag, excluding current)
  const { data: allSessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await apiGet<{ sessions: Array<{ id: string; title: string; goalTag?: string }> }>("/sessions");
      return res.sessions;
    },
  });

  const relatedSessions = useMemo(() => {
    if (!session || !allSessions) return [];
    const related = allSessions
      .filter(s => s.id !== sessionId && s.goalTag === session.goalTag)
      .slice(0, 6); // Limit to 6
    return related;
  }, [session, allSessions, sessionId]);

  // Get frequency explanation for "Why this works" section (must be before early return)
  const frequencyExplanation = useMemo(() => {
    if (!session) return null;
    return getFrequencyExplanation(session.brainwaveState);
  }, [session?.brainwaveState]);

  // Fetch playback bundle to get mix info
  const { data: bundle } = useQuery({
    queryKey: ["playback-bundle", sessionId],
    queryFn: async () => {
      try {
        const json = await apiGet<{ bundle: any }>(`/sessions/${sessionId}/playback-bundle`);
        return json.bundle;
      } catch {
        return null; // Bundle might not be ready
      }
    },
    enabled: !!session,
  });

  const handleStart = () => {
    navigation.navigate("Player", { sessionId });
  };

  const handleToggleSaved = async () => {
    await toggleSavedSession(sessionId);
    queryClient.invalidateQueries({ queryKey: ["session-saved", sessionId] });
    queryClient.invalidateQueries({ queryKey: ["saved-sessions"] });
  };

  const handleRelatedSessionPress = (relatedSessionId: string) => {
    navigation.replace("SessionDetail", { sessionId: relatedSessionId });
  };

  if (isLoading || !session) {
    return (
      <AppScreen>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </AppScreen>
    );
  }

  // Get voice name from voiceId
  const voiceName = session.voiceId ? formatVoiceId(session.voiceId) : "Unknown";

  // Get background/binaural info from bundle
  const backgroundName = bundle?.background ? "Atmospheric Ambience" : "None";
  const binauralHz = bundle?.binaural?.hz ? `${bundle.binaural.hz}Hz` : "None";

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

        {/* Session Info */}
        <View style={styles.sessionInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{session.title}</Text>
            <Pressable
              onPress={handleToggleSaved}
              style={styles.saveButton}
            >
              <MaterialIcons
                name={isSaved ? "bookmark" : "bookmark-border"}
                size={24}
                color={isSaved ? theme.colors.accent.highlight : theme.colors.text.primary}
              />
            </Pressable>
          </View>

          {session.goalTag && (
            <View style={styles.tags}>
              <Chip label={formatGoalTag(session.goalTag)} variant="default" />
            </View>
          )}

          {/* Recommended Times */}
          <View style={styles.recommendedTimes}>
            <MaterialIcons name="schedule" size={16} color={theme.colors.text.tertiary} />
            <Text style={styles.recommendedText}>
              Recommended: Morning • Evening
            </Text>
          </View>
        </View>

        {/* What's Inside */}
        <View style={styles.section}>
          <SectionHeader title="What's Inside" />
          <Card variant="default" style={styles.insideCard}>
            <View style={styles.insideItem}>
              <MaterialIcons name="record-voice-over" size={24} color={theme.colors.accent.primary} />
              <View style={styles.insideItemContent}>
                <Text style={styles.insideItemLabel}>Voice</Text>
                <Text style={styles.insideItemValue}>{voiceName}</Text>
              </View>
            </View>
            <View style={styles.insideItem}>
              <MaterialIcons name="waves" size={24} color={theme.colors.accent.secondary} />
              <View style={styles.insideItemContent}>
                <Text style={styles.insideItemLabel}>Binaural Beats</Text>
                <Text style={styles.insideItemValue}>{binauralHz}</Text>
              </View>
            </View>
            <View style={styles.insideItem}>
              <MaterialIcons name="nature" size={24} color={theme.colors.semantic.success} />
              <View style={styles.insideItemContent}>
                <Text style={styles.insideItemLabel}>Atmosphere</Text>
                <Text style={styles.insideItemValue}>{backgroundName}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Why This Works - Frequency Explanation */}
        {frequencyExplanation && (
          <View style={styles.section}>
            <SectionHeader title="Why this works" />
            <Card variant="default" style={styles.frequencyCard}>
              <View style={styles.frequencyContent}>
                <Text style={styles.frequencyTitle}>{frequencyExplanation.title}</Text>
                <Text style={styles.frequencyText}>{frequencyExplanation.content}</Text>
                {frequencyExplanation.benefits.length > 0 && (
                  <View style={styles.benefitsContainer}>
                    {frequencyExplanation.benefits.map((benefit, index) => (
                      <View key={index} style={styles.benefitItem}>
                        <MaterialIcons name="check-circle" size={20} color={theme.colors.accent.primary} />
                        <Text style={styles.benefitText}>{benefit}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </Card>
          </View>
        )}

        {/* Affirmations Preview */}
        {session.affirmations && session.affirmations.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Affirmations" />
            <Card variant="default" style={styles.affirmationsCard}>
              <Text style={styles.affirmationsPreview}>
                {session.affirmations.slice(0, 3).join(" • ")}
                {session.affirmations.length > 3 && " • ..."}
              </Text>
              <Text style={styles.affirmationsCount}>
                {session.affirmations.length} total affirmations
              </Text>
            </Card>
          </View>
        )}

        {/* Related Sessions */}
        {relatedSessions.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Related Sessions" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedScroll}
            >
              {relatedSessions.map((related) => (
                <Card
                  key={related.id}
                  variant="surface"
                  onPress={() => handleRelatedSessionPress(related.id)}
                  style={styles.relatedCard}
                >
                  <View style={styles.relatedCardContent}>
                    <Text style={styles.relatedCardTitle} numberOfLines={2}>
                      {related.title}
                    </Text>
                    {related.goalTag && (
                      <Text style={styles.relatedCardTag}>{formatGoalTag(related.goalTag)}</Text>
                    )}
                  </View>
                </Card>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <PrimaryButton
            label="Start Session"
            onPress={handleStart}
            variant="gradient"
            size="lg"
            icon="play-arrow"
            iconPosition="left"
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </AppScreen>
  );
}

// Helper functions
function formatGoalTag(goalTag: string): string {
  return goalTag
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatVoiceId(voiceId: string): string {
  // Map voice IDs to display names
  const voiceMap: Record<string, string> = {
    shimmer: "Shimmer",
    onyx: "Onyx",
    nova: "Nova",
    echo: "Echo",
    fable: "Fable",
    alloy: "Alloy",
  };
  return voiceMap[voiceId] || voiceId.charAt(0).toUpperCase() + voiceId.slice(1);
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing[6],
  },
  loadingText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },
  sessionInfo: {
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[6],
    gap: theme.spacing[4],
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing[3],
  },
  title: {
    ...theme.typography.styles.h1,
    fontSize: theme.typography.fontSize["3xl"],
    color: theme.colors.text.primary,
    flex: 1,
  },
  saveButton: {
    padding: theme.spacing[2],
    marginTop: -theme.spacing[1],
  },
  tags: {
    flexDirection: "row",
    gap: theme.spacing[2],
  },
  recommendedTimes: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  recommendedText: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
  section: {
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[6],
    gap: theme.spacing[4],
  },
  insideCard: {
    gap: theme.spacing[4],
  },
  insideItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[4],
  },
  insideItemContent: {
    flex: 1,
    gap: theme.spacing[0],
  },
  insideItemLabel: {
    ...theme.typography.styles.caption,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: theme.typography.letterSpacing.wider,
  },
  insideItemValue: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  affirmationsCard: {
    gap: theme.spacing[3],
  },
  affirmationsPreview: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.relaxed,
  },
  affirmationsCount: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.tertiary,
  },
  relatedScroll: {
    gap: theme.spacing[3],
    paddingRight: theme.spacing[6],
  },
  relatedCard: {
    width: 160,
    padding: theme.spacing[4],
  },
  relatedCardContent: {
    gap: theme.spacing[2],
  },
  relatedCardTitle: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  relatedCardTag: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.tertiary,
  },
  actionContainer: {
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[6],
  },
  frequencyCard: {
    gap: theme.spacing[4],
  },
  frequencyContent: {
    gap: theme.spacing[4],
  },
  frequencyTitle: {
    ...theme.typography.styles.h3,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  frequencyText: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.relaxed,
    color: theme.colors.text.secondary,
  },
  benefitsContainer: {
    gap: theme.spacing[3],
    marginTop: theme.spacing[2],
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing[3],
  },
  benefitText: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.normal,
    color: theme.colors.text.secondary,
    flex: 1,
  },
});

