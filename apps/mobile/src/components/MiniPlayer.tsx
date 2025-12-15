import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getAudioEngine, type AudioEngineSnapshot } from "@ab/audio-engine";
import { apiGet } from "../lib/api";
import { theme } from "../theme/tokens";

interface MiniPlayerProps {
  onPress?: () => void;
  sessionId?: string | null;
}

/**
 * MiniPlayer - Global mini player component
 * Displays current session and playback controls
 * Appears when a session is active, hidden when idle
 */
export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onPress, sessionId }) => {
  const engine = useMemo(() => getAudioEngine(), []);
  const [snapshot, setSnapshot] = useState<AudioEngineSnapshot>(() => engine.getState());

  useEffect(() => engine.subscribe((s) => setSnapshot(s)), [engine]);

  // Fetch session details if sessionId is provided
  const { data: session } = useQuery({
    queryKey: ["session", sessionId || snapshot.sessionId],
    queryFn: async () => {
      const id = sessionId || snapshot.sessionId;
      if (!id) return null;
      const res = await apiGet<any>(`/sessions/${id}`);
      return res;
    },
    enabled: !!(sessionId || snapshot.sessionId),
  });

  // Only show if there's an active session
  const activeSessionId = sessionId || snapshot.sessionId;
  const isPlaying = snapshot.status === "playing";
  const isPaused = snapshot.status === "paused";
  const isPreroll = snapshot.status === "preroll";

  if (!activeSessionId || snapshot.status === "idle" || snapshot.status === "error") {
    return null;
  }

  const sessionTitle = session?.title || "Session";

  const handlePlayPause = () => {
    if (isPlaying || isPreroll) {
      engine.pause();
    } else if (isPaused || snapshot.status === "ready") {
      engine.play();
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <LinearGradient
          colors={theme.colors.gradients.accent}
          style={styles.image}
        />
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {sessionTitle}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {isPreroll ? "Starting..." : isPlaying ? "Playing" : "Paused"}
          </Text>
        </View>
      </View>
      <View style={styles.controls}>
        <View style={styles.visualizer}>
          {[12, 20, 16, 8].map((height, index) => (
            <View
              key={index}
              style={[
                styles.bar,
                { height, opacity: isPlaying ? 1 : 0.5 },
              ]}
            />
          ))}
        </View>
        <Pressable
          style={styles.playButton}
          onPress={handlePlayPause}
          hitSlop={8}
        >
          <MaterialIcons
            name={
              isPlaying || isPreroll
                ? "pause-circle-filled"
                : "play-circle-filled"
            }
            size={32}
            color={theme.colors.text.primary}
          />
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 85, // Above bottom navigation
    left: theme.spacing[4],
    right: theme.spacing[4],
    height: 64,
    backgroundColor: "rgba(30, 27, 75, 0.95)",
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing[4],
    justifyContent: "space-between",
    ...theme.shadows.ios.md,
    ...theme.shadows.android.md,
  },
  pressed: {
    opacity: 0.9,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
    flex: 1,
    minWidth: 0,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    gap: theme.spacing[1],
  },
  title: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.tertiary,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
  },
  visualizer: {
    height: 32,
    width: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  bar: {
    width: 4,
    backgroundColor: theme.colors.accent.secondary,
    borderRadius: theme.radius.full,
  },
  playButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});

