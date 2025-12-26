import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Keyboard,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { AppScreen, MiniPlayer, ApiConnectionStatus, ForYouSection, TuneForYou, type CurationCard } from "../components";
import { theme } from "../theme";
import { getAudioEngine } from "@ab/audio-engine";
import { useDraftStore } from "../state/useDraftStore";
import {
  getLastSession,
  saveLastSession,
  getRecentIntentions,
  upsertRecentIntention,
  deleteRecentIntention,
  type LastSession,
  type RecentIntention,
} from "../storage/homeStorage";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "../lib/api";
import type { SessionV3 } from "@ab/contracts";
import { useAuthToken } from "../lib/auth";
import { getUserStruggle } from "../lib/values";
import { decideAudioSettings, packToSessionPayload, type AffirmationPack } from "../lib/affirmationPack";

const MAX_INTENTION_LENGTH = 160;
const CHAR_COUNTER_THRESHOLD = 140;

export default function HomeScreen({ navigation }: any) {
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSession, setLastSession] = useState<LastSession | null>(null);
  const [recentIntentions, setRecentIntentions] = useState<RecentIntention[]>([]);
  const [affirmationCount, setAffirmationCount] = useState<6 | 12 | 18 | 24>(12);
  const [reviewPack, setReviewPack] = useState<AffirmationPack | null>(null);
  
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { initializeDraft, updateDraft } = useDraftStore();
  const engine = useMemo(() => getAudioEngine(), []);
  const [snapshot, setSnapshot] = useState(() => engine.getState());
  const currentSessionId = snapshot.sessionId;
  const authToken = useAuthToken();

  useEffect(() => engine.subscribe((s) => setSnapshot(s)), [engine]);

  // Load data on mount and focus
  useFocusEffect(
    React.useCallback(() => {
      loadHomeData();
    }, [])
  );

  const loadHomeData = async () => {
    const [session, intentions] = await Promise.all([
      getLastSession(),
      getRecentIntentions(),
    ]);
    setLastSession(session);
    setRecentIntentions(intentions);
  };

  // Fetch last session details if we have a session ID
  const { data: lastSessionDetails } = useQuery({
    queryKey: ["last-session-details", lastSession?.id],
    queryFn: async () => {
      if (!lastSession) return null;
      try {
        const res = await apiGet<SessionV3>(`/sessions/${lastSession.id}`);
        return res;
      } catch (error) {
        console.error("[HomeScreen] Error fetching last session:", error);
        return null;
      }
    },
    enabled: !!lastSession,
  });

  const trimmedInput = inputText.trim();
  const hasInput = trimmedInput.length > 0;
  const inputLength = inputText.length;
  const showCharCounter = inputLength >= CHAR_COUNTER_THRESHOLD;
  const isNearLimit = inputLength >= MAX_INTENTION_LENGTH;

  const handleInputChange = (text: string) => {
    if (text.length <= MAX_INTENTION_LENGTH) {
      setInputText(text);
    }
  };

  const handleClearInput = () => {
    setInputText("");
    inputRef.current?.focus();
  };

  const handleQuickGenerate = async () => {
    if (!hasInput || isGenerating) return;

    setIsGenerating(true);
    
    try {
      // Save to recent intentions
      await upsertRecentIntention(trimmedInput);
      await loadHomeData(); // Refresh recent intentions
      
      // Fetch user values and struggle if available
      let userStruggle: string | undefined = undefined;

      try {
        const struggleResponse = await getUserStruggle(authToken);
        userStruggle = struggleResponse.struggle || undefined;
      } catch (err) {
        // Silently skip if user struggle fetch fails - it's optional
        if (__DEV__) {
          console.log("[HomeScreen] Could not fetch user struggle, skipping:", err instanceof Error ? err.message : String(err));
        }
      }

      // Determine session type from goal
      const goalLower = trimmedInput.toLowerCase();
      let sessionType = "Meditate";
      if (goalLower.includes("focus") || goalLower.includes("work") || goalLower.includes("concentration")) {
        sessionType = "Focus";
      } else if (goalLower.includes("sleep") || goalLower.includes("rest")) {
        sessionType = "Sleep";
      } else if (goalLower.includes("anxiety") || goalLower.includes("calm")) {
        sessionType = "Anxiety Relief";
      }

      // Generate affirmations
      const response = await apiPost<{ affirmations: string[]; reasoning?: string }>(
        "/affirmations/generate",
        {
          sessionType,
          struggle: userStruggle,
          goal: trimmedInput, // User's written goal - most important input
          count: affirmationCount,
        },
        authToken
      );

      // Auto-select audio settings
      const audioSettings = decideAudioSettings(trimmedInput);

      // Fetch user's existing sessions to get used titles
      let usedTitles: string[] = [];
      try {
        const sessionsResponse = await apiGet<{ sessions: Array<{ title: string }> }>("/sessions", authToken);
        usedTitles = sessionsResponse.sessions
          .filter(s => s.title) // Only include sessions with titles
          .map(s => s.title);
      } catch (err) {
        console.log("[HomeScreen] Could not fetch user sessions for title deduplication:", err);
        // Continue without used titles - better to have a duplicate than fail
      }

      // Create pack
      const pack: AffirmationPack = {
        goal: trimmedInput,
        affirmations: response.affirmations,
        style: "balanced",
        length: affirmationCount,
        audioSettings,
      };

      // Skip review - directly create session and navigate to player
      const payload = packToSessionPayload(pack, usedTitles);
      const res = await apiPost<SessionV3>("/sessions", payload, authToken);
      
      // Clear input
      setInputText("");
      setIsGenerating(false);
      
      // Navigate directly to Player (which will handle audio generation loading)
      navigation.getParent()?.navigate("Player", { sessionId: res.id });
    } catch (error) {
      setIsGenerating(false);
      
      // Provide more helpful error messages
      let errorMessage = "Could not generate affirmations. Please check your connection and try again.";
      
      if (error instanceof Error) {
        const errorStr = error.message.toLowerCase();
        
        // Check for network-related errors
        if (errorStr.includes("network request failed") || 
            errorStr.includes("failed to fetch") ||
            errorStr.includes("networkerror") ||
            errorStr.includes("connection")) {
          errorMessage = "Cannot connect to server. Please make sure:\n\n• The API server is running\n• You're connected to the internet\n• Your device can reach the server";
        } else if (errorStr.includes("unauthorized") || errorStr.includes("401")) {
          errorMessage = "Authentication failed. Please try logging in again.";
        } else if (errorStr.includes("rate limit") || errorStr.includes("429")) {
          errorMessage = "Too many requests. Please wait a moment and try again.";
        } else {
          errorMessage = error.message;
        }
        
        console.error("[HomeScreen] Error in quick generate:", error);
      } else {
        console.error("[HomeScreen] Error in quick generate (unknown):", error);
      }
      
      Alert.alert("Generation Failed", errorMessage);
    }
  };

  const handleStartSession = async () => {
    if (!reviewPack) return;

    try {
      setIsGenerating(true);
      
      // Fetch user's existing sessions to get used titles
      let usedTitles: string[] = [];
      try {
        const sessionsResponse = await apiGet<{ sessions: Array<{ title: string }> }>("/sessions", authToken);
        usedTitles = sessionsResponse.sessions
          .filter(s => s.title) // Only include sessions with titles
          .map(s => s.title);
      } catch (err) {
        console.log("[HomeScreen] Could not fetch user sessions for title deduplication:", err);
        // Continue without used titles - better to have a duplicate than fail
      }
      
      const payload = packToSessionPayload(reviewPack, usedTitles);
      const res = await apiPost<SessionV3>("/sessions", payload, authToken);
      
      // Clear review pack and input
      setReviewPack(null);
      setInputText("");
      setIsGenerating(false);
      
      // Navigate to Player
      navigation.getParent()?.navigate("Player", { sessionId: res.id });
    } catch (error) {
      console.error("[HomeScreen] Failed to create session:", error);
      setIsGenerating(false);
      Alert.alert("Failed to Start", "Could not create session. Please try again.");
    }
  };

  const handleCustomSession = async () => {
    if (!hasInput || isGenerating) return;

    setIsGenerating(true);
    
    try {
      // Save to recent intentions
      await upsertRecentIntention(trimmedInput);
      await loadHomeData();
      
      // Prefill draft with intention for custom builder
      initializeDraft();
      updateDraft({
        title: trimmedInput,
        goalTag: "General",
      });

      // Navigate to Editor (Custom Session Builder)
      navigation.getParent()?.navigate("Editor");
      
      // Clear input after successful navigation
      setTimeout(() => {
        setInputText("");
        setIsGenerating(false);
      }, 300);
    } catch (error) {
      console.error("[HomeScreen] Error in custom session:", error);
      setIsGenerating(false);
    }
  };

  const handleInputSubmit = () => {
    if (hasInput) {
      handleQuickGenerate();
    }
  };

  const handleRecentIntentionPress = (intention: RecentIntention) => {
    setInputText(intention.text);
    // Scroll to input
    setTimeout(() => {
      inputRef.current?.focus();
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  const handleContinueLastSession = () => {
    if (lastSession) {
      navigation.getParent()?.navigate("Player", { sessionId: lastSession.id });
    }
  };

  const handleDeleteRecent = async (id: string) => {
    await deleteRecentIntention(id);
    await loadHomeData();
  };

  const handleMiniPlayerPress = () => {
    if (currentSessionId) {
      navigation.getParent()?.navigate("Player", { sessionId: currentSessionId });
    }
  };

  const handleCurationCardPress = useCallback(async (card: CurationCard) => {
    try {
      setIsGenerating(true);

      // Generate affirmations based on card title/goal
      const goal = card.title;
      let sessionType = "Meditate";
      if (goal.toLowerCase().includes("focus") || goal.toLowerCase().includes("work")) {
        sessionType = "Focus";
      } else if (goal.toLowerCase().includes("sleep") || goal.toLowerCase().includes("downshift")) {
        sessionType = "Sleep";
      } else if (goal.toLowerCase().includes("calm") || goal.toLowerCase().includes("steady")) {
        sessionType = "Anxiety Relief";
      }

      // Fetch user struggle if available
      let userStruggle: string | undefined = undefined;
      try {
        const struggleResponse = await getUserStruggle(authToken);
        userStruggle = struggleResponse.struggle || undefined;
      } catch (err) {
        // Silently skip if user struggle fetch fails
      }

      // Generate affirmations
      const response = await apiPost<{ affirmations: string[]; reasoning?: string }>(
        "/affirmations/generate",
        {
          sessionType,
          struggle: userStruggle,
          goal: goal,
          count: 12, // Default count for curated sessions
        },
        authToken
      );

      // Create session with card's audio settings
      const payload = {
        title: goal,
        goalTag: sessionType,
        affirmations: response.affirmations,
        voiceId: card.voiceId,
        frequencyHz: card.brainLayerPreset === "alpha" ? 10 : card.brainLayerPreset === "beta" ? 20 : card.brainLayerPreset === "delta" ? 2 : 10,
        brainwaveState: card.brainLayerPreset.charAt(0).toUpperCase() + card.brainLayerPreset.slice(1),
        solfeggioHz: undefined,
      };

      const res = await apiPost<SessionV3>("/sessions", payload, authToken);
      
      // Track session start event
      try {
        await apiPost(`/sessions/${res.id}/events`, {
          eventType: "start",
          metadata: { source: "curation_card", cardSlot: card.slot },
        }, authToken);
      } catch (err) {
        // Non-critical, continue
      }

      setIsGenerating(false);
      
      // Navigate to Player
      navigation.getParent()?.navigate("Player", { sessionId: res.id });
    } catch (error) {
      setIsGenerating(false);
      console.error("[HomeScreen] Error handling curation card:", error);
      Alert.alert("Failed to Start", "Could not create session from recommendation. Please try again.");
    }
  }, [authToken, navigation, setIsGenerating]);

  // Format last session metadata
  const getLastSessionMetadata = () => {
    if (!lastSession) return "";
    const parts: string[] = [];
    if (lastSession.voiceDisplayName) {
      parts.push(lastSession.voiceDisplayName);
    }
    if (lastSession.beatDisplayName) {
      parts.push(lastSession.beatDisplayName);
    }
    if (lastSession.backgroundDisplayName) {
      parts.push(lastSession.backgroundDisplayName);
    }
    return parts.join(" · ") || "Session";
  };

  return (
    <AppScreen>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <Text style={styles.headerGreeting}>It's great to see you.</Text>
              <Text style={styles.headerSubtitle}>What do you need to hear today?</Text>
            </View>
            <Pressable 
              style={styles.profileButton}
              onPress={() => navigation.getParent()?.navigate("Settings")}
            >
              <LinearGradient
                colors={["#6c757d", "#495057"]}
                style={styles.profileImage}
              />
            </Pressable>
          </View>
        </View>

        {/* API Connection Status (dev only) */}
        {__DEV__ && <ApiConnectionStatus />}

        {/* Intention Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="What do you need to hear today?"
              placeholderTextColor={theme.colors.text.muted}
              value={inputText}
              onChangeText={handleInputChange}
              multiline
              maxLength={MAX_INTENTION_LENGTH}
              returnKeyType="go"
              onSubmitEditing={handleInputSubmit}
              blurOnSubmit={false}
            />
            {hasInput && (
              <Pressable style={styles.clearButton} onPress={handleClearInput}>
                <MaterialIcons name="close" size={18} color={theme.colors.text.tertiary} />
              </Pressable>
            )}
          </View>
          <View style={styles.inputHelper}>
            <Text style={styles.helperText}>
              One sentence is enough. You can edit before you start.
            </Text>
            {showCharCounter && (
              <Text style={[styles.charCounter, isNearLimit && styles.charCounterWarning]}>
                {inputLength} / {MAX_INTENTION_LENGTH}
              </Text>
            )}
          </View>
        </View>

        {/* Affirmation Count Selector */}
        {hasInput && !reviewPack && (
          <View style={styles.countSection}>
            <Text style={styles.countLabel}>Number of Affirmations</Text>
            <View style={styles.countOptions}>
              {([6, 12, 18, 24] as const).map((count) => (
                <Pressable
                  key={count}
                  style={[
                    styles.countOption,
                    affirmationCount === count && styles.countOptionActive,
                  ]}
                  onPress={() => setAffirmationCount(count)}
                >
                  <Text
                    style={[
                      styles.countOptionText,
                      affirmationCount === count && styles.countOptionTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Review Gate */}
        {reviewPack ? (
          <View style={styles.reviewGate}>
            <Text style={styles.reviewTitle}>Here's what we made. Edit anything.</Text>

            {/* Affirmations Preview */}
            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>Affirmations (first 6)</Text>
              {reviewPack.affirmations.slice(0, 6).map((aff, i) => (
                <Text key={i} style={styles.previewAffirmation}>
                  {i + 1}. {aff}
                </Text>
              ))}
              {reviewPack.affirmations.length > 6 && (
                <Text style={styles.previewMore}>
                  + {reviewPack.affirmations.length - 6} more
                </Text>
              )}
            </View>

            {/* Audio Summary */}
            <View style={styles.audioSummary}>
              <View style={styles.audioChip}>
                <Text style={styles.audioChipLabel}>Voice:</Text>
                <Text style={styles.audioChipValue}>{reviewPack.audioSettings.voiceId}</Text>
              </View>
              <View style={styles.audioChip}>
                <Text style={styles.audioChipLabel}>Brain layer:</Text>
                <Text style={styles.audioChipValue}>
                  {reviewPack.audioSettings.brainLayerType} {reviewPack.audioSettings.brainLayerPreset}
                </Text>
              </View>
              <View style={styles.audioChip}>
                <Text style={styles.audioChipLabel}>Background:</Text>
                <Text style={styles.audioChipValue}>{reviewPack.audioSettings.backgroundId}</Text>
              </View>
            </View>

            <View style={styles.reviewActions}>
              <Pressable
                style={[styles.ctaButton, styles.ctaButtonSecondary]}
                onPress={() => setReviewPack(null)}
              >
                <Text style={[styles.ctaButtonText, styles.ctaButtonTextSecondary]}>EDIT</Text>
              </Pressable>
              <Pressable
                style={[styles.ctaButton, isGenerating && styles.ctaButtonDisabled]}
                onPress={handleStartSession}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" style={styles.buttonSpinner} />
                    <Text style={styles.ctaButtonText}>STARTING…</Text>
                  </>
                ) : (
                  <Text style={styles.ctaButtonText}>START SESSION</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          /* Primary CTAs */
          <View style={styles.ctaRow}>
            <Pressable
              style={[styles.ctaButton, !hasInput && styles.ctaButtonDisabled]}
              onPress={handleQuickGenerate}
              disabled={!hasInput || isGenerating}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" style={styles.buttonSpinner} />
                  <Text style={styles.ctaButtonText}>GENERATING…</Text>
                </>
              ) : (
                <Text style={styles.ctaButtonText}>QUICK GENERATE</Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.ctaButton, styles.ctaButtonSecondary, !hasInput && styles.ctaButtonDisabled]}
              onPress={handleCustomSession}
              disabled={!hasInput || isGenerating}
            >
              <Text style={[styles.ctaButtonText, styles.ctaButtonTextSecondary]}>CUSTOM SESSION</Text>
            </Pressable>
          </View>
        )}

        {/* Continue Last Session */}
        {!reviewPack && lastSession && lastSessionDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>CONTINUE LAST SESSION</Text>
            <Pressable style={styles.continueCard} onPress={handleContinueLastSession}>
              <View style={styles.continueCardLeft}>
                <View style={styles.continuePlayIcon}>
                  <MaterialIcons name="play-arrow" size={24} color={theme.colors.text.primary} />
                </View>
              </View>
              <View style={styles.continueCardContent}>
                <Text style={styles.continuePrimaryText}>Continue</Text>
                <Text style={styles.continueSecondaryText} numberOfLines={1}>
                  {getLastSessionMetadata()}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.text.tertiary} />
            </Pressable>
          </View>
        )}

        {/* FOR YOU Section */}
        {!reviewPack && (
          <>
            <ForYouSection onCardPress={handleCurationCardPress} />
            <View style={styles.section}>
              <TuneForYou />
            </View>
          </>
        )}

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
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[12],
    paddingBottom: theme.spacing[6],
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
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  headerSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 17, // Slightly larger for more inviting feel
    color: theme.colors.text.secondary,
    lineHeight: 24, // More relaxed
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
  inputSection: {
    paddingHorizontal: theme.spacing[6],
    marginBottom: theme.spacing[6],
  },
  inputContainer: {
    position: "relative",
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"], // Much more curved - 32px
    borderWidth: 0, // Remove border for softer look
    minHeight: 120,
    paddingHorizontal: theme.spacing[6], // More generous padding
    paddingTop: theme.spacing[6],
    paddingBottom: theme.spacing[6],
    // Soft shadow instead of border for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 17, // Slightly larger for more inviting feel
    color: theme.colors.text.primary,
    lineHeight: 26, // More relaxed line height
    minHeight: 72,
    textAlignVertical: "top",
    paddingRight: 32, // Space for clear button
    // Subtle curved interior feel with padding
  },
  clearButton: {
    position: "absolute",
    top: theme.spacing[4],
    right: theme.spacing[4],
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  inputHelper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing[2],
  },
  helperText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.text.tertiary,
    flex: 1,
  },
  charCounter: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 13,
    color: theme.colors.text.tertiary,
    marginLeft: theme.spacing[2],
  },
  charCounterWarning: {
    color: "#ef4444",
  },
  ctaRow: {
    flexDirection: "row",
    gap: theme.spacing[3],
    paddingHorizontal: theme.spacing[6],
    marginBottom: theme.spacing[8],
  },
  ctaButton: {
    flex: 1,
    height: 56,
    backgroundColor: theme.colors.accent.primary,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: theme.spacing[2],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: theme.colors.accent.primary,
  },
  ctaButtonDisabled: {
    opacity: 0.4,
  },
  buttonSpinner: {
    marginRight: theme.spacing[1],
  },
  ctaButtonText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  ctaButtonTextSecondary: {
    color: theme.colors.accent.primary,
  },
  section: {
    paddingHorizontal: theme.spacing[6],
    marginBottom: theme.spacing[6],
  },
  sectionHeader: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 11,
    color: theme.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: theme.spacing[3],
  },
  continueCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.xl, // More curved
    padding: theme.spacing[5], // More generous padding
    borderWidth: 0, // Remove border
    gap: theme.spacing[3],
    // Soft shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  continueCardLeft: {
    marginRight: theme.spacing[2],
  },
  continuePlayIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  continueCardContent: {
    flex: 1,
    minWidth: 0,
  },
  continuePrimaryText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  continueSecondaryText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.text.tertiary,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing[4], // More vertical padding
    paddingHorizontal: theme.spacing[5], // More horizontal padding
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.lg, // More curved
    marginBottom: theme.spacing[3],
    borderWidth: 0, // Remove border
    // Soft shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  recentItemText: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 15,
    color: theme.colors.text.primary,
    marginRight: theme.spacing[2],
  },
  countSection: {
    paddingHorizontal: theme.spacing[6],
    marginBottom: theme.spacing[6],
  },
  countLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[3],
  },
  countOptions: {
    flexDirection: "row",
    gap: theme.spacing[2],
  },
  countOption: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.radius.xl, // More curved
    borderWidth: 0, // Remove border for softer look
    backgroundColor: theme.colors.background.surface,
    alignItems: "center",
    // Subtle shadow instead
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  countOptionActive: {
    backgroundColor: theme.colors.accent.primary + "15", // Softer active state
    // Remove border, use background color change only
  },
  countOptionText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  countOptionTextActive: {
    color: theme.colors.text.primary,
    fontWeight: "600",
  },
  reviewGate: {
    paddingHorizontal: theme.spacing[6],
    gap: theme.spacing[6],
    marginBottom: theme.spacing[6],
  },
  reviewTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 20,
    fontWeight: "600",
    color: theme.colors.text.primary,
    textAlign: "center",
  },
  previewSection: {
    backgroundColor: theme.colors.background.surfaceElevated,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  previewLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[3],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  previewAffirmation: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
    lineHeight: 20,
  },
  previewMore: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontStyle: "italic",
    marginTop: theme.spacing[2],
  },
  audioSummary: {
    gap: theme.spacing[2],
  },
  audioChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.surfaceElevated,
    borderRadius: theme.radius.md,
    padding: theme.spacing[3],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    gap: theme.spacing[2],
  },
  audioChipLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  audioChipValue: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.text.primary,
    flex: 1,
  },
  reviewActions: {
    flexDirection: "row",
    gap: theme.spacing[3],
  },
});
