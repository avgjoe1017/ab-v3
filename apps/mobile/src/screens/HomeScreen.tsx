import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { MiniPlayer, ApiConnectionStatus, ForYouSection, type CurationCard } from "../components";
import { MessageBubble } from "./ChatComposer/components/MessageBubble";
import { theme } from "../theme";
import { getAudioEngine } from "@ab/audio-engine";
import {
  getLastSession,
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
import { randomUUID } from "expo-crypto";

const MAX_INTENTION_LENGTH = 160;

// Message types for chat interface
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  kind: "text" | "loading";
  text: string;
};

const OPENER_MESSAGE = "Hello! What would you like to hear today? Share your intention, and I'll create a personalized session for you.";

export default function HomeScreen({ navigation }: any) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: randomUUID(),
      role: "assistant",
      kind: "text",
      text: OPENER_MESSAGE,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSession, setLastSession] = useState<LastSession | null>(null);
  const [recentIntentions, setRecentIntentions] = useState<RecentIntention[]>([]);
  const [affirmationCount, setAffirmationCount] = useState<6 | 12 | 18 | 24>(12);
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  
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

  const handleInputChange = (text: string) => {
    if (text.length <= MAX_INTENTION_LENGTH) {
      setInputText(text);
    }
  };

  const addMessage = useCallback((message: Omit<ChatMessage, "id">) => {
    setMessages((prev) => [...prev, { ...message, id: randomUUID() }]);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const removeLastMessage = useCallback(() => {
    setMessages((prev) => prev.slice(0, -1));
  }, []);

  const handleSend = async () => {
    if (!hasInput || isGenerating) return;

    const userMessage: ChatMessage = {
      id: randomUUID(),
      role: "user",
      kind: "text",
      text: trimmedInput,
    };

    addMessage(userMessage);
    setInputText("");

    // Save to recent intentions
    await upsertRecentIntention(trimmedInput);
    await loadHomeData();

    // Add loading message
    addMessage({
      role: "assistant",
      kind: "loading",
      text: "Creating your personalized session...",
    });

    setIsGenerating(true);

    try {
      // Fetch user values and struggle if available
      let userStruggle: string | undefined = undefined;

      try {
        const struggleResponse = await getUserStruggle(authToken);
        userStruggle = struggleResponse.struggle || undefined;
      } catch (err) {
        if (__DEV__) {
          console.log("[HomeScreen] Could not fetch user struggle:", err);
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
          goal: trimmedInput,
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
          .filter((s) => s.title)
          .map((s) => s.title);
      } catch (err) {
        console.log("[HomeScreen] Could not fetch user sessions:", err);
      }

      // Create pack
      const pack: AffirmationPack = {
        goal: trimmedInput,
        affirmations: response.affirmations,
        style: "balanced",
        length: affirmationCount,
        audioSettings,
      };

      // Remove loading message
      removeLastMessage();

      // Create session and navigate
      const payload = packToSessionPayload(pack, usedTitles);
      const res = await apiPost<SessionV3>("/sessions", payload, authToken);

      // Add success message
      addMessage({
        role: "assistant",
        kind: "text",
        text: `Perfect! I've created a session for you. Here's a preview:\n\n${response.affirmations.slice(0, 3).map((a, i) => `${i + 1}. ${a}`).join("\n")}${response.affirmations.length > 3 ? `\n\n+ ${response.affirmations.length - 3} more affirmations` : ""}\n\nStarting your session now...`,
      });

      setIsGenerating(false);

      // Navigate to Player
      setTimeout(() => {
        navigation.getParent()?.navigate("Player", { sessionId: res.id });
      }, 2000);
    } catch (error) {
      removeLastMessage();
      setIsGenerating(false);

      let errorMessage = "Could not generate affirmations. Please check your connection and try again.";

      if (error instanceof Error) {
        const errorStr = error.message.toLowerCase();

        if (
          errorStr.includes("network request failed") ||
          errorStr.includes("failed to fetch") ||
          errorStr.includes("networkerror") ||
          errorStr.includes("connection")
        ) {
          errorMessage = "Cannot connect to server. Please make sure the API server is running and you're connected to the internet.";
        } else if (errorStr.includes("unauthorized") || errorStr.includes("401")) {
          errorMessage = "Authentication failed. Please try logging in again.";
        } else if (errorStr.includes("rate limit") || errorStr.includes("429")) {
          errorMessage = "Too many requests. Please wait a moment and try again.";
        } else {
          errorMessage = error.message;
        }

        console.error("[HomeScreen] Error in generation:", error);
      }

      addMessage({
        role: "assistant",
        kind: "text",
        text: `Sorry, I encountered an error: ${errorMessage}\n\nWould you like to try again?`,
      });
    }
  };

  const handleCurationCardPress = useCallback(
    async (card: CurationCard) => {
      try {
        setIsGenerating(true);

        const goal = card.title;
        let sessionType = "Meditate";
        if (goal.toLowerCase().includes("focus") || goal.toLowerCase().includes("work")) {
          sessionType = "Focus";
        } else if (goal.toLowerCase().includes("sleep") || goal.toLowerCase().includes("downshift")) {
          sessionType = "Sleep";
        } else if (goal.toLowerCase().includes("calm") || goal.toLowerCase().includes("steady")) {
          sessionType = "Anxiety Relief";
        }

        let userStruggle: string | undefined = undefined;
        try {
          const struggleResponse = await getUserStruggle(authToken);
          userStruggle = struggleResponse.struggle || undefined;
        } catch (err) {
          // Silently skip
        }

        const response = await apiPost<{ affirmations: string[]; reasoning?: string }>(
          "/affirmations/generate",
          {
            sessionType,
            struggle: userStruggle,
            goal: goal,
            count: 12,
          },
          authToken
        );

        const payload = {
          title: goal,
          goalTag: sessionType,
          affirmations: response.affirmations,
          voiceId: card.voiceId,
          frequencyHz:
            card.brainLayerPreset === "alpha"
              ? 10
              : card.brainLayerPreset === "beta"
              ? 20
              : card.brainLayerPreset === "delta"
              ? 2
              : 10,
          brainwaveState: card.brainLayerPreset.charAt(0).toUpperCase() + card.brainLayerPreset.slice(1),
          solfeggioHz: undefined,
        };

        const res = await apiPost<SessionV3>("/sessions", payload, authToken);

        try {
          await apiPost(
            `/sessions/${res.id}/events`,
            {
              eventType: "start",
              metadata: { source: "curation_card", cardSlot: card.slot },
            },
            authToken
          );
        } catch (err) {
          // Non-critical
        }

        setIsGenerating(false);

        navigation.getParent()?.navigate("Player", { sessionId: res.id });
      } catch (error) {
        setIsGenerating(false);
        console.error("[HomeScreen] Error handling curation card:", error);
        Alert.alert("Failed to Start", "Could not create session from recommendation. Please try again.");
      }
    },
    [authToken, navigation]
  );

  const handleRecentIntentionPress = (intention: RecentIntention) => {
    setInputText(intention.text);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleMiniPlayerPress = () => {
    if (currentSessionId) {
      navigation.getParent()?.navigate("Player", { sessionId: currentSessionId });
    }
  };

  const canSend = hasInput && !isGenerating;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today</Text>
        <Pressable
          style={styles.settingsButton}
          onPress={() => navigation.getParent()?.navigate("Settings")}
        >
          <MaterialIcons name="settings" size={24} color={theme.colors.text.primary} />
        </Pressable>
      </View>

      {__DEV__ && (
        <View style={styles.devStatus}>
          <ApiConnectionStatus />
        </View>
      )}

      {/* Chat Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble role={item.role} kind={item.kind} text={item.text} />
          )}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            messages.length === 1 ? (
              <View style={styles.headerContent}>
                <ForYouSection onCardPress={handleCurationCardPress} />
              </View>
            ) : null
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        />

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="What do you need to hear today?"
              placeholderTextColor={theme.colors.text.muted}
              value={inputText}
              onChangeText={handleInputChange}
              multiline
              maxLength={MAX_INTENTION_LENGTH}
              returnKeyType="send"
              onSubmitEditing={canSend ? handleSend : undefined}
              blurOnSubmit={false}
              editable={!isGenerating}
            />
            {canSend && (
              <Pressable style={styles.sendButton} onPress={handleSend} hitSlop={8}>
                <MaterialIcons name="arrow-upward" size={20} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
          {inputText.length > 0 && (
            <Text style={styles.charCounter}>
              {inputText.length} / {MAX_INTENTION_LENGTH}
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Mini Player */}
      <MiniPlayer sessionId={currentSessionId} onPress={handleMiniPlayerPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: "700",
    color: theme.colors.text.primary,
  },
  settingsButton: {
    padding: theme.spacing[1],
  },
  devStatus: {
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[2],
  },
  keyboardView: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[2],
  },
  headerContent: {
    paddingBottom: theme.spacing[4],
  },
  inputContainer: {
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[3],
    paddingHorizontal: theme.spacing[6],
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    paddingVertical: 0,
    paddingHorizontal: 0,
    maxHeight: 100,
    fontFamily: theme.typography.fontFamily.regular,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: theme.spacing[2],
  },
  charCounter: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing[1],
    marginLeft: theme.spacing[4],
  },
});
