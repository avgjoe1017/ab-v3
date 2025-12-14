import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions, ImageBackground, ScrollView } from "react-native";
// @ts-expect-error - expo-linear-gradient types may not be available immediately after install
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "../lib/api";
import { PlaybackBundleVMSchema, type PlaybackBundleVM } from "@ab/contracts";
import { getAudioEngine, type AudioEngineSnapshot } from "@ab/audio-engine";
import Slider from "@react-native-community/slider";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Helper to format time in MM:SS
function formatTime(ms: number): string {
  if (!ms || isNaN(ms)) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function PlayerScreen({ route, navigation }: any) {
  const sessionId: string = route.params.sessionId;
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [mixPanelOpen, setMixPanelOpen] = useState(false);

  // Fetch session details for title/metadata
  const { data: sessionData } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const res = await apiGet<any>(`/sessions/${sessionId}`);
      return res;
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["playback-bundle", sessionId],
    queryFn: async () => {
      try {
        const json = await apiGet<{ bundle: PlaybackBundleVM }>(`/sessions/${sessionId}/playback-bundle`);
        return PlaybackBundleVMSchema.parse(json.bundle);
      } catch (err: any) {
        if (err?.message?.includes("AUDIO_NOT_READY") || err?.message?.includes("Audio not generated")) {
          throw new Error("AUDIO_NOT_READY");
        }
        throw err;
      }
    },
    retry: false,
  });

  const handleGenerateAudio = async () => {
    setIsGenerating(true);
    try {
      const response = await apiPost<{ status: string; jobId?: string }>(`/sessions/${sessionId}/ensure-audio`, {});
      
      if (response.status === "ready") {
        queryClient.invalidateQueries({ queryKey: ["playback-bundle", sessionId] });
        setIsGenerating(false);
        return;
      }
      
      if (response.jobId) {
        const pollJob = async () => {
          let attempts = 0;
          const maxAttempts = 30;
          
          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            try {
              const jobResponse = await apiGet<{ job: { status: string; error?: string } }>(`/jobs/${response.jobId}`);
              
              if (jobResponse.job.status === "completed") {
                queryClient.invalidateQueries({ queryKey: ["playback-bundle", sessionId] });
                setIsGenerating(false);
                return;
              } else if (jobResponse.job.status === "failed") {
                throw new Error(jobResponse.job.error || "Audio generation failed");
              }
            } catch (err) {
              console.error("Error polling job:", err);
            }
            
            attempts++;
          }
          
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

  // Auto-load and auto-play when bundle data is available
  useEffect(() => {
    if (!data) return;

    const currentSessionId = data.sessionId;
    const isNewSession = lastLoadedSessionId !== currentSessionId;
    const isDifferentSession = snapshot.sessionId !== currentSessionId;
    
    const needsLoad = isNewSession || isDifferentSession;

    if (needsLoad) {
      console.log("[PlayerScreen] Auto-loading session:", currentSessionId);
      engine.load(data).then(() => {
        setLastLoadedSessionId(currentSessionId);
        console.log("[PlayerScreen] Session loaded, will auto-play when ready");
      }).catch((error) => {
        console.error("[PlayerScreen] Auto-load failed:", error);
      });
      return;
    }
    
    if (status === "ready" && 
        snapshot.sessionId === currentSessionId && 
        lastLoadedSessionId === currentSessionId &&
        snapshot.status !== "playing" &&
        snapshot.status !== "preroll") {
      const timer = setTimeout(() => {
        console.log("[PlayerScreen] Auto-playing session:", currentSessionId);
        engine.play().catch((error) => {
          console.error("[PlayerScreen] Auto-play failed:", error);
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [data, status, engine, lastLoadedSessionId, snapshot.sessionId, snapshot.status]);

  const sessionTitle = sessionData?.title || "Deep Rest";
  const isPlaying = status === "playing" || status === "preroll";
  const isPaused = status === "paused";
  const canPlay = status === "ready" || status === "paused" || status === "idle";

  // Audio visualization bars (heights matching HTML)
  const barHeights = [16, 24, 32, 20, 40, 48, 28, 56, 36, 20, 32, 48, 64, 40, 24, 32, 48, 64, 32, 40, 24, 16, 32, 48, 28, 20, 36, 44, 24, 16];
  const activeBars = 16; // First 16 bars are active (primary color), rest are muted

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCiGU0Pe_rpmK1biRM98ucc4iM-UpR76i7FaWn5kk5xx9G5FbweSQtV1zfVoHljz-EP2bfL-hqYtUMx5NcmcN1gpMksiJa-ziPi_ErpGMf1-cBAm28bl9rGsCiTFteAfYyvZ7_dx0QA27WalRfTi2A8DSUF-t1bSmH86cxvNScFMmyfEe6g8Crpew3IGTA8wGi5wtTb3S7VIpvM63EoaLyPsWV4BuHSAKZ7i7F4Wa4iKhb7F7Tj12mF-RxFnx9HvhwqgIA13ZlMDrc" }}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <LinearGradient
          colors={["rgba(67, 56, 202, 0.4)", "rgba(88, 28, 135, 0.4)", "rgba(30, 58, 138, 0.6)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={["transparent", "rgba(15, 23, 42, 0.2)", "rgba(15, 23, 42, 0.9)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      <View style={styles.content}>
        {/* Top Navigation */}
        <View style={styles.topNav}>
          <Pressable 
            style={styles.topNavButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Pressable style={styles.topNavButton}>
            <MaterialIcons name="more-horiz" size={24} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.spacer} />

        {/* Main Content Card */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardHeader}>
            <Text style={styles.sessionTitle}>{sessionTitle}</Text>
            <Text style={styles.sessionSubtitle}>Delta 2Hz · 30 min</Text>
          </View>

          {/* Audio Visualization */}
          <View style={styles.audioVizContainer}>
            {barHeights.map((height, index) => (
              <View
                key={index}
                style={[
                  styles.audioBar,
                  { 
                    height,
                    backgroundColor: index < activeBars ? "#FDE047" : "rgba(255, 255, 255, 0.3)"
                  }
                ]}
              />
            ))}
          </View>

          {/* Time Display */}
          <View style={styles.timeDisplay}>
            <Text style={styles.timeLabel}>Session Focus</Text>
            <Text style={styles.timeValue}>
              {formatTime(positionMs)} / {formatTime(durationMs)}
            </Text>
          </View>
        </View>

        {/* Playback Controls */}
        <View style={styles.controlsCard}>
          <Pressable style={styles.controlButton}>
            <MaterialIcons name="skip-previous" size={36} color="#fff" />
          </Pressable>
          <Pressable
            style={styles.playButton}
            onPress={() => {
              if (isPlaying) {
                engine.pause();
              } else if (canPlay) {
                engine.play();
              }
            }}
          >
            <MaterialIcons 
              name={isPlaying ? "pause" : "play-arrow"} 
              size={36} 
              color="#0f172a" 
            />
          </Pressable>
          <Pressable style={styles.controlButton}>
            <MaterialIcons name="skip-next" size={36} color="#fff" />
          </Pressable>
        </View>

        {/* Mix Audio Panel */}
        <View style={[styles.mixPanel, mixPanelOpen && styles.mixPanelOpen]}>
          <Pressable
            style={styles.mixPanelHeader}
            onPress={() => setMixPanelOpen(!mixPanelOpen)}
          >
            <View style={styles.mixPanelHeaderLeft}>
              <MaterialIcons name="tune" size={24} color="#FDE047" />
              <Text style={styles.mixPanelTitle}>Mix Audio</Text>
            </View>
            <MaterialIcons 
              name={mixPanelOpen ? "expand-more" : "expand-less"} 
              size={24} 
              color="#fff" 
            />
          </Pressable>
          
          {mixPanelOpen && (
            <View style={styles.mixControls}>
              {/* Affirmations */}
              <View style={styles.mixControl}>
                <View style={styles.mixControlHeader}>
                  <Text style={styles.mixControlLabel}>Affirmations</Text>
                  <Text style={styles.mixControlValue}>{Math.round(mix.affirmations * 100)}%</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={mix.affirmations * 100}
                  onValueChange={(value) => engine.setMix({ ...mix, affirmations: value / 100 })}
                  minimumTrackTintColor="#FDE047"
                  maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                  thumbTintColor="#FDE047"
                />
              </View>

              {/* Binaural */}
              <View style={styles.mixControl}>
                <View style={styles.mixControlHeader}>
                  <Text style={styles.mixControlLabel}>Binaural Frequency</Text>
                  <Text style={styles.mixControlValue}>{Math.round(mix.binaural * 100)}%</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={mix.binaural * 100}
                  onValueChange={(value) => engine.setMix({ ...mix, binaural: value / 100 })}
                  minimumTrackTintColor="#FDE047"
                  maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                  thumbTintColor="#FDE047"
                />
              </View>

              {/* Atmosphere */}
              <View style={styles.mixControl}>
                <View style={styles.mixControlHeader}>
                  <Text style={styles.mixControlLabel}>Atmosphere</Text>
                  <Text style={styles.mixControlValue}>{Math.round(mix.background * 100)}%</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={mix.background * 100}
                  onValueChange={(value) => engine.setMix({ ...mix, background: value / 100 })}
                  minimumTrackTintColor="#FDE047"
                  maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                  thumbTintColor="#FDE047"
                />
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Audio Not Ready</Text>
          <Text style={styles.errorMessage}>
            {error instanceof Error && error.message.includes("AUDIO_NOT_READY") 
              ? "Audio hasn't been generated yet."
              : error instanceof Error ? error.message : String(error)}
          </Text>
          {error instanceof Error && error.message.includes("AUDIO_NOT_READY") && (
            <Pressable
              onPress={handleGenerateAudio}
              disabled={isGenerating}
              style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
            >
              <Text style={styles.generateButtonText}>
                {isGenerating ? "Generating..." : "Generate Audio"}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    maxWidth: SCREEN_WIDTH,
    height: 850,
    overflow: "hidden",
    borderRadius: 40,
    backgroundColor: "#1e293b",
  },
  backgroundImage: {
    position: "absolute",
    inset: 0,
    opacity: 0.8,
  },
  backgroundImageStyle: {
    resizeMode: "cover",
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 48,
    paddingBottom: 32,
    justifyContent: "space-between",
    zIndex: 10,
  },
  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  topNavButton: {
    padding: 12,
    borderRadius: 9999,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  spacer: {
    flexGrow: 1,
  },
  mainCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  mainCardHeader: {
    marginBottom: 24,
  },
  sessionTitle: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 4,
    color: "#fff",
  },
  sessionSubtitle: {
    color: "rgba(147, 197, 253, 1)",
    fontSize: 18,
    opacity: 0.8,
    fontWeight: "500",
  },
  audioVizContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    marginBottom: 24,
    paddingHorizontal: 4,
    gap: 2,
  },
  audioBar: {
    width: 4,
    borderRadius: 9999,
  },
  timeDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
    color: "rgba(191, 219, 254, 1)",
    textTransform: "uppercase",
    opacity: 0.7,
  },
  timeValue: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
    color: "rgba(191, 219, 254, 1)",
    textTransform: "uppercase",
    opacity: 0.7,
  },
  controlsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 32,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  controlButton: {
    padding: 16,
  },
  playButton: {
    width: 80,
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDE047",
    borderRadius: 40,
    shadowColor: "#FDE047",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  mixPanel: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  mixPanelOpen: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  mixPanelHeader: {
    width: "100%",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mixPanelHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mixPanelTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  mixControls: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
    gap: 24,
  },
  mixControl: {
    gap: 8,
  },
  mixControlHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mixControlLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(191, 219, 254, 1)",
  },
  mixControlValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(191, 219, 254, 1)",
    opacity: 0.7,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  errorContainer: {
    position: "absolute",
    top: 100,
    left: 24,
    right: 24,
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fca5a5",
    zIndex: 100,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#991b1b",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#991b1b",
    marginBottom: 12,
  },
  generateButton: {
    backgroundColor: "#000",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  generateButtonDisabled: {
    backgroundColor: "#9ca3af",
    opacity: 0.6,
  },
  generateButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
