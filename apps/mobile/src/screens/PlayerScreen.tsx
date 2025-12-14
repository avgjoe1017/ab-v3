import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "../lib/api";
import { API_BASE_URL } from "../lib/config";
import { PlaybackBundleVMSchema, type PlaybackBundleVM } from "@ab/contracts";
import { getAudioEngine, type AudioEngineStatus, type AudioEngineSnapshot } from "@ab/audio-engine";

// Helper to format time in MM:SS
function formatTime(ms: number): string {
  if (!ms || isNaN(ms)) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Helper to get status color
function getStatusColor(status: AudioEngineStatus): { color: string } {
  switch (status) {
    case "playing":
      return { color: "#10b981" }; // green
    case "preroll":
      return { color: "#f59e0b" }; // amber
    case "loading":
      return { color: "#3b82f6" }; // blue
    case "paused":
      return { color: "#6b7280" }; // gray
    case "error":
      return { color: "#ef4444" }; // red
    default:
      return { color: "#6b7280" }; // gray
  }
}

export default function PlayerScreen({ route }: any) {
  const sessionId: string = route.params.sessionId;
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["playback-bundle", sessionId],
    queryFn: async () => {
      try {
        const json = await apiGet<{ bundle: PlaybackBundleVM }>(`/sessions/${sessionId}/playback-bundle`);
        return PlaybackBundleVMSchema.parse(json.bundle);
      } catch (err: any) {
        // Check if error is "AUDIO_NOT_READY"
        if (err?.message?.includes("AUDIO_NOT_READY") || err?.message?.includes("Audio not generated")) {
          throw new Error("AUDIO_NOT_READY");
        }
        throw err;
      }
    },
    retry: false, // Don't retry automatically
  });

  const handleGenerateAudio = async () => {
    setIsGenerating(true);
    try {
      const response = await apiPost<{ status: string; jobId?: string }>(`/sessions/${sessionId}/ensure-audio`, {});
      
      // If audio is already ready, refetch immediately
      if (response.status === "ready") {
        queryClient.invalidateQueries({ queryKey: ["playback-bundle", sessionId] });
        setIsGenerating(false);
        return;
      }
      
      // If job was created, poll for completion
      if (response.jobId) {
        const pollJob = async () => {
          let attempts = 0;
          const maxAttempts = 30; // 30 seconds max
          
          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            
            try {
              const jobResponse = await apiGet<{ job: { status: string; error?: string } }>(`/jobs/${response.jobId}`);
              
              if (jobResponse.job.status === "completed") {
                // Audio generated! Refetch bundle
                queryClient.invalidateQueries({ queryKey: ["playback-bundle", sessionId] });
                setIsGenerating(false);
                return;
              } else if (jobResponse.job.status === "failed") {
                throw new Error(jobResponse.job.error || "Audio generation failed");
              }
              // Otherwise, keep polling (status is "pending" or "processing")
            } catch (err) {
              console.error("Error polling job:", err);
            }
            
            attempts++;
          }
          
          // Timeout - but still try to refetch in case it completed
          setIsGenerating(false);
          queryClient.invalidateQueries({ queryKey: ["playback-bundle", sessionId] });
        };
        
        pollJob();
      } else {
        setIsGenerating(false);
      }
    } catch (err) {
      console.error("Failed to generate audio:", err);
      setIsGenerating(false);
    }
  };

  const engine = useMemo(() => getAudioEngine(), []);
  const [snapshot, setSnapshot] = useState<AudioEngineSnapshot>(() => engine.getState());
  const [lastLoadedSessionId, setLastLoadedSessionId] = useState<string | null>(null);

  useEffect(() => engine.subscribe((s) => setSnapshot(s)), [engine]);

  const status = snapshot.status;
  const positionMs = snapshot.positionMs;
  const durationMs = snapshot.durationMs;
  const mix = snapshot.mix;

  // Calculate progress percentage (0-100)
  const progress = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;

  // Auto-load and auto-play when bundle data is available
  useEffect(() => {
    if (!data) return;

    const currentSessionId = data.sessionId;
    const isNewSession = lastLoadedSessionId !== currentSessionId;
    const isDifferentSession = snapshot.sessionId !== currentSessionId;
    const needsLoad = isNewSession || isDifferentSession || status === "idle";

    // If it's a new/different session or we're idle, load it
    // AudioEngine.load() will handle stopping current session if needed
    if (needsLoad) {
      console.log("[PlayerScreen] Auto-loading session:", currentSessionId);
      engine.load(data).then(() => {
        setLastLoadedSessionId(currentSessionId);
        console.log("[PlayerScreen] Session loaded, will auto-play when ready");
      }).catch((error) => {
        console.error("[PlayerScreen] Auto-load failed:", error);
      });
    }
    
    // Auto-play when bundle is ready (and it's the current session)
    if (status === "ready" && snapshot.sessionId === currentSessionId) {
      // Small delay to ensure everything is set up
      const timer = setTimeout(() => {
        console.log("[PlayerScreen] Auto-playing session:", currentSessionId);
        engine.play().catch((error) => {
          console.error("[PlayerScreen] Auto-play failed:", error);
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [data, status, engine, lastLoadedSessionId, snapshot.sessionId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Player</Text>
      <Text style={styles.sessionId}>Session: {sessionId}</Text>
      
      {/* Status Display */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={[styles.statusText, getStatusColor(status)]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      </View>

      {/* Progress Bar and Time Display */}
      {(status === "playing" || status === "paused" || status === "preroll") && durationMs > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${Math.min(100, Math.max(0, progress))}%` }]} />
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(positionMs)}</Text>
            <Text style={styles.timeText}>{formatTime(durationMs)}</Text>
          </View>
        </View>
      )}

      {/* Loading State */}
      {isLoading && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>Loading bundle...</Text>
        </View>
      )}

      {/* Error Display with Better UI */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Failed to load bundle</Text>
          <Text style={styles.errorMessage}>
            {error instanceof Error ? error.message : String(error)}
          </Text>
          {error instanceof Error && error.message.includes("AUDIO_NOT_READY") && (
            <View style={styles.errorActionContainer}>
              <Text style={styles.errorActionText}>
                Audio hasn't been generated yet. Tap below to generate it.
              </Text>
              <Pressable
                onPress={handleGenerateAudio}
                disabled={isGenerating}
                style={[
                  styles.generateButton,
                  { opacity: isGenerating ? 0.6 : 1, backgroundColor: isGenerating ? "#9ca3af" : "#3b82f6" }
                ]}
              >
                <Text style={styles.generateButtonText}>
                  {isGenerating ? "Generating Audio..." : "Generate Audio"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        <Pressable
          disabled={!data || status === "loading"}
          onPress={async () => {
            if (!data) return;
            try {
              console.log("[PlayerScreen] Loading bundle...");
              await engine.load(data);
              console.log("[PlayerScreen] Bundle loaded successfully");
            } catch (error) {
              console.error("[PlayerScreen] Failed to load bundle:", error);
              alert(`Failed to load bundle: ${error}`);
            }
          }}
          style={[styles.button, { opacity: (!data || status === "loading") ? 0.5 : 1 }]}
        >
          <Text style={styles.buttonText}>{status === "loading" ? "Loading..." : "Load"}</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            // Only allow play if we have a bundle loaded or if we're in a valid state
            if (data || status === "ready" || status === "paused" || status === "idle") {
              engine.play();
            }
          }}
          disabled={status === "playing" || status === "preroll" || (!data && status !== "idle")}
          style={[
            styles.button,
            styles.playButton,
            { opacity: (status === "playing" || status === "preroll" || (!data && status !== "idle")) ? 0.5 : 1 }
          ]}
        >
          <Text style={[styles.buttonText, styles.playButtonText]}>Play</Text>
        </Pressable>

        <Pressable
          onPress={() => engine.pause()}
          disabled={status !== "playing" && status !== "preroll"}
          style={[styles.button, { opacity: (status !== "playing" && status !== "preroll") ? 0.5 : 1 }]}
        >
          <Text style={styles.buttonText}>Pause</Text>
        </Pressable>

        <Pressable
          onPress={() => engine.stop()}
          disabled={status === "idle"}
          style={[styles.button, { opacity: status === "idle" ? 0.5 : 1 }]}
        >
          <Text style={styles.buttonText}>Stop</Text>
        </Pressable>
      </View>

      {/* Volume Controls */}
      {data && (status === "ready" || status === "playing" || status === "paused") && (
        <View style={styles.volumeContainer}>
          <Text style={styles.volumeTitle}>Volume Controls</Text>
          
          <View style={styles.volumeRow}>
            <Text style={styles.volumeLabel}>Affirmations</Text>
            <View style={styles.volumeControls}>
              <Pressable
                onPress={() => engine.setMix({ ...mix, affirmations: Math.max(0, mix.affirmations - 0.1) })}
                style={styles.volumeButton}
              >
                <Text style={styles.volumeButtonText}>-</Text>
              </Pressable>
              <Text style={styles.volumeValue}>{Math.round(mix.affirmations * 100)}%</Text>
              <Pressable
                onPress={() => engine.setMix({ ...mix, affirmations: Math.min(1, mix.affirmations + 0.1) })}
                style={styles.volumeButton}
              >
                <Text style={styles.volumeButtonText}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.volumeRow}>
            <Text style={styles.volumeLabel}>Binaural</Text>
            <View style={styles.volumeControls}>
              <Pressable
                onPress={() => engine.setMix({ ...mix, binaural: Math.max(0, mix.binaural - 0.1) })}
                style={styles.volumeButton}
              >
                <Text style={styles.volumeButtonText}>-</Text>
              </Pressable>
              <Text style={styles.volumeValue}>{Math.round(mix.binaural * 100)}%</Text>
              <Pressable
                onPress={() => engine.setMix({ ...mix, binaural: Math.min(1, mix.binaural + 0.1) })}
                style={styles.volumeButton}
              >
                <Text style={styles.volumeButtonText}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.volumeRow}>
            <Text style={styles.volumeLabel}>Background</Text>
            <View style={styles.volumeControls}>
              <Pressable
                onPress={() => engine.setMix({ ...mix, background: Math.max(0, mix.background - 0.1) })}
                style={styles.volumeButton}
              >
                <Text style={styles.volumeButtonText}>-</Text>
              </Pressable>
              <Text style={styles.volumeValue}>{Math.round(mix.background * 100)}%</Text>
              <Pressable
                onPress={() => engine.setMix({ ...mix, background: Math.min(1, mix.background + 0.1) })}
                style={styles.volumeButton}
              >
                <Text style={styles.volumeButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  sessionId: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    fontSize: 12,
    color: "#6b7280",
  },
  button: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    marginBottom: 8,
  },
  buttonText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
  },
  volumeContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  volumeTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  volumeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  volumeLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  volumeControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  volumeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
  },
  volumeButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#3b82f6",
  },
  volumeValue: {
    fontSize: 14,
    fontWeight: "500",
    minWidth: 40,
    textAlign: "center",
  },
  messageContainer: {
    padding: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    marginBottom: 12,
  },
  messageText: {
    color: "#374151",
    fontSize: 14,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fca5a5",
    marginBottom: 12,
  },
  errorTitle: {
    color: "#991b1b",
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 8,
  },
  errorMessage: {
    color: "#991b1b",
    fontSize: 14,
    marginBottom: 12,
  },
  errorActionContainer: {
    marginTop: 8,
  },
  errorActionText: {
    color: "#991b1b",
    fontSize: 12,
    marginBottom: 12,
  },
  generateButton: {
    padding: 12,
    borderRadius: 8,
  },
  generateButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 14,
  },
  controlsContainer: {
    gap: 8,
  },
  playButton: {
    backgroundColor: "#3b82f6",
    borderColor: "#2563eb",
  },
  playButtonText: {
    color: "#fff",
  },
});
