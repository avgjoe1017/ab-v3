import React, { useEffect, useMemo, useState, useRef } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Platform, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, ApiError } from "../lib/api";
import { PlaybackBundleVMSchema, type PlaybackBundleVM } from "@ab/contracts";
import { getAudioEngine, type AudioEngineSnapshot } from "@ab/audio-engine";
import Slider from "@react-native-community/slider";
import { AppScreen, IconButton, PlayerMenu, PrimaryButton, SaveMixPresetSheet, PrimerAnimation, LivingOrb } from "../components";
import { theme } from "../theme";
import { useSleepTimer } from "../hooks/useSleepTimer";
import { saveMixPreset } from "../storage/mixPresets";
import { getPlayerBackgroundGradient, getSessionGradient } from "../lib/sessionArt";

// Helper to format sleep timer time remaining
function formatSleepTimer(ms: number | null): string {
  if (!ms || ms === 0) return "";
  const totalMinutes = Math.floor(ms / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function isAudioNotReadyError(err: unknown): boolean {
  if (err instanceof ApiError) return err.code === "AUDIO_NOT_READY";
  if (err instanceof Error) return err.message.includes("AUDIO_NOT_READY");
  return false;
}

// Helper to convert mix value (0-1) to Low/Medium/High label
function getMixLabel(value: number): string {
  if (value < 0.33) return "Low";
  if (value < 0.67) return "Medium";
  return "High";
}

// LivingOrb component is now imported from components

export default function PlayerScreen({ route, navigation }: any) {
  const sessionId: string = route.params.sessionId;
  const [isGenerating, setIsGenerating] = useState(false);
  const [mixPanelOpen, setMixPanelOpen] = useState(false);
  const [mixPanelExpanded, setMixPanelExpanded] = useState(false); // New state for slider expansion
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveMixSheetOpen, setSaveMixSheetOpen] = useState(false);
  const { duration: sleepTimerDuration, timeRemaining, setSleepTimer, clearSleepTimer } = useSleepTimer();
  const queryClient = useQueryClient();
  
  // Animated value for play button breathing glow
  const glowOpacity = useRef(new Animated.Value(0)).current;

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
        const bundle = PlaybackBundleVMSchema.parse(json.bundle);
        return bundle;
      } catch (err: any) {
        if (err instanceof ApiError && err.code === "AUDIO_NOT_READY") {
          throw new Error("AUDIO_NOT_READY");
        }
        throw err;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
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
  // If audio is not ready, redirect to loading screen instead of showing error
  useEffect(() => {
    if (!data) {
      if (isAudioNotReadyError(error) && !isGenerating) {
        // Redirect to loading screen instead of generating inline
        navigation.replace("AudioGenerationLoading", { sessionId });
        return;
      }
      return;
    }

    const currentSessionId = data.sessionId;
    const isNewSession = lastLoadedSessionId !== currentSessionId;
    const isDifferentSession = snapshot.sessionId !== currentSessionId;
    
    const needsLoad = isNewSession || isDifferentSession;

    if (needsLoad) {
      // Resolve bundled assets (binaural/solfeggio/background) to local URIs for faster loading
      (async () => {
        try {
          const { resolveBundledAsset } = await import("../lib/bundledAssets");
          const resolvedData: any = {
            ...data,
            background: {
              ...data.background,
              urlByPlatform: {
                ios: await resolveBundledAsset(
                  Platform.OS === "ios" ? data.background.urlByPlatform.ios : data.background.urlByPlatform.android,
                  "background"
                ),
                android: await resolveBundledAsset(
                  Platform.OS === "android" ? data.background.urlByPlatform.android : data.background.urlByPlatform.ios,
                  "background"
                ),
              },
            },
          };
          
          // Resolve brain layer (binaural or solfeggio)
          if (data.solfeggio) {
            resolvedData.solfeggio = {
              ...data.solfeggio,
              urlByPlatform: {
                ios: await resolveBundledAsset(
                  Platform.OS === "ios" ? data.solfeggio.urlByPlatform.ios : data.solfeggio.urlByPlatform.android,
                  "solfeggio"
                ),
                android: await resolveBundledAsset(
                  Platform.OS === "android" ? data.solfeggio.urlByPlatform.android : data.solfeggio.urlByPlatform.ios,
                  "solfeggio"
                ),
              },
            };
          } else if (data.binaural) {
            resolvedData.binaural = {
              ...data.binaural,
              urlByPlatform: {
                ios: await resolveBundledAsset(
                  Platform.OS === "ios" ? data.binaural.urlByPlatform.ios : data.binaural.urlByPlatform.android,
                  "binaural"
                ),
                android: await resolveBundledAsset(
                  Platform.OS === "android" ? data.binaural.urlByPlatform.android : data.binaural.urlByPlatform.ios,
                  "binaural"
                ),
              },
            };
          }
          
          engine.load(resolvedData).then(() => {
            setLastLoadedSessionId(currentSessionId);
          }).catch((error) => {
            console.error("[PlayerScreen] ❌ Auto-load failed:", error);
          });
        } catch (resolveError) {
          console.warn("[PlayerScreen] Failed to resolve bundled assets, using original URLs:", resolveError);
          // Fallback to original bundle if resolution fails
          engine.load(data).then(() => {
            setLastLoadedSessionId(currentSessionId);
          }).catch((error) => {
            console.error("[PlayerScreen] ❌ Auto-load failed:", error);
          });
        }
      })();
      return;
    }
    
    if (status === "ready" && 
        snapshot.sessionId === currentSessionId && 
        lastLoadedSessionId === currentSessionId &&
        snapshot.status !== "playing") {
      const timer = setTimeout(() => {
        engine.play().catch((error) => {
          console.error("[PlayerScreen] Auto-play failed:", error);
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [data, error, status, engine, lastLoadedSessionId, snapshot.sessionId, snapshot.status, isGenerating]);

  const sessionTitle = sessionData?.title || "Deep Rest";
  const frequencyHz = sessionData?.frequencyHz;
  const brainwaveState = sessionData?.brainwaveState;
  const solfeggioHz = sessionData?.solfeggioHz;
  
  // Phase 4.1: Format frequency display (binaural or solfeggio)
  const frequencyDisplay = solfeggioHz
    ? `Solfeggio ${solfeggioHz}Hz`
    : frequencyHz && brainwaveState
    ? `${brainwaveState} ${frequencyHz}Hz`
    : frequencyHz
    ? `${frequencyHz}Hz`
    : null;
  
  // Get gradient colors for background (based on session/goal)
  const backgroundGradient = getPlayerBackgroundGradient(sessionId, sessionData?.goalTag);
  const sessionGradient = getSessionGradient(sessionId, sessionData?.goalTag);
  
  const isPlaying = status === "playing";
  const isPreroll = status === "preroll";
  const isPaused = status === "paused";
  const canPlay = status === "ready" || status === "paused" || status === "idle";
  const [primerVisible, setPrimerVisible] = React.useState(false);

  // Breathing glow animation for play button (only when playing)
  useEffect(() => {
    if (isPlaying || isPreroll) {
      // Start breathing animation
      const breathingAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.3,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      breathingAnimation.start();
      return () => breathingAnimation.stop();
    } else {
      // Fade out glow when paused
      Animated.timing(glowOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isPlaying, isPreroll, glowOpacity]);

  // Show primer animation during preroll
  React.useEffect(() => {
    if (isPreroll && !primerVisible) {
      setPrimerVisible(true);
    } else if (!isPreroll && primerVisible) {
      // Keep visible briefly after preroll ends for smooth transition
      const timer = setTimeout(() => setPrimerVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isPreroll, primerVisible]);

  // Audio visualization bars
  const barHeights = [16, 24, 32, 20, 40, 48, 28, 56, 36, 20, 32, 48, 64, 40, 24, 32, 48, 64, 32, 40, 24, 16, 32, 48, 28, 20, 36, 44, 24, 16];
  const activeBars = 16;

  const handleRestart = () => {
    engine.seek(0);
    engine.play();
    setMenuOpen(false);
  };

  const handleEndSession = () => {
    engine.stop();
    // Check if we can go back, otherwise navigate to Home
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("MainTabs", { screen: "Today" });
    }
  };

  const handleSaveMix = async (name: string) => {
    try {
      await saveMixPreset({
        name,
        mix: snapshot.mix,
        voiceId: sessionData?.voiceId,
      });
      queryClient.invalidateQueries({ queryKey: ["mix-presets"] });
    } catch (error) {
      console.error("[PlayerScreen] Error saving mix preset:", error);
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* Gradient background - duotone style */}
      <LinearGradient
        colors={backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      >
        {/* Large decorative icon */}
        <View style={styles.backgroundIconContainer}>
          <MaterialIcons
            name={sessionGradient.icon}
            size={400}
            color="rgba(255, 255, 255, 0.05)"
          />
        </View>
      </LinearGradient>
      <AppScreen gradient={false} style={styles.appScreenOverlay}>
      <View style={styles.content}>
        {/* Top Navigation */}
        <View style={styles.topNav}>
          <IconButton
            icon="arrow-back"
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate("MainTabs", { screen: "Today" });
              }
            }}
            variant="filled"
          />
          <View style={styles.topNavRight}>
            {sleepTimerDuration !== null && timeRemaining !== null && (
              <View style={styles.sleepTimerBadge}>
                <MaterialIcons name="bedtime" size={16} color={theme.colors.accent.highlight} />
                <Text style={styles.sleepTimerText}>{formatSleepTimer(timeRemaining)}</Text>
              </View>
            )}
            <IconButton
              icon="more-horiz"
              onPress={() => setMenuOpen(true)}
              variant="filled"
            />
          </View>
        </View>

        <View style={styles.spacer} />

        {/* Error Display - Improved UI */}
        {error && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={24} color={theme.colors.semantic.error} />
            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>Audio Not Ready</Text>
              <Text style={styles.errorMessage}>
                {isAudioNotReadyError(error)
                  ? "Audio hasn't been generated yet. We'll generate it for you."
                  : error instanceof Error ? error.message : String(error)}
              </Text>
              {isAudioNotReadyError(error) && (
                <PrimaryButton
                  label={isGenerating ? "Generating..." : "Generate Audio"}
                  onPress={handleGenerateAudio}
                  disabled={isGenerating}
                  size="sm"
                  style={styles.errorButton}
                />
              )}
            </View>
          </View>
        )}

        {/* Main Content Card */}
        {!error && (
          <View style={styles.mainCard}>
            {/* Audio Visualization - Living Orb */}
            <View style={styles.audioVizContainer}>
              <LivingOrb size={240} />
            </View>
          </View>
        )}

        {/* Playback Controls */}
        {!error && (
          <View style={styles.controlsCard}>
            <View style={styles.playButtonContainer}>
              {/* Breathing glow - only visible when playing */}
              <Animated.View
                style={[
                  styles.playButtonGlow,
                  {
                    opacity: glowOpacity,
                  },
                ]}
              />
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
                  name={(isPlaying || isPreroll) ? "pause" : "play-arrow"} 
                  size={40} 
                  color={theme.colors.background.primary} 
                />
              </Pressable>
            </View>
          </View>
        )}

        {/* Session Title and Details - Moved to Bottom */}
        {!error && (
          <View style={styles.sessionInfoContainer}>
            <Text style={styles.sessionTitle}>{sessionTitle}</Text>
            {frequencyDisplay && (
              <Text style={styles.sessionSubtitle}>
                Currently playing: {frequencyDisplay} waves
              </Text>
            )}
          </View>
        )}

        {/* Mix Audio Panel */}
        {!error && (
          <View style={[styles.mixPanel, mixPanelOpen && styles.mixPanelOpen]}>
            <Pressable
              style={styles.mixPanelHeader}
              onPress={() => {
                const newOpen = !mixPanelOpen;
                setMixPanelOpen(newOpen);
                // Reset expanded state when closing panel
                if (!newOpen) {
                  setMixPanelExpanded(false);
                }
              }}
              onLongPress={() => {
                if (mixPanelOpen) {
                  setMixPanelExpanded(!mixPanelExpanded);
                }
              }}
            >
              <View style={styles.mixPanelHeaderLeft}>
                <MaterialIcons name="tune" size={24} color={theme.colors.accent.highlight} />
                <Text style={styles.mixPanelTitle}>Mix Audio</Text>
              </View>
              <MaterialIcons 
                name={mixPanelOpen ? "expand-more" : "expand-less"} 
                size={24} 
                color={theme.colors.text.primary} 
              />
            </Pressable>
            
            {mixPanelOpen && (
              <View style={styles.mixControls}>
                {/* Affirmations */}
                <View style={styles.mixControl}>
                  <View style={styles.mixControlHeader}>
                    <Text style={styles.mixControlLabel}>Affirmations</Text>
                    <View style={styles.mixControlRight}>
                      <View style={styles.mixBarContainer}>
                        <View style={[styles.mixBar, { width: `${mix.affirmations * 100}%` }]} />
                      </View>
                      <Text style={styles.mixControlValue}>{getMixLabel(mix.affirmations)}</Text>
                    </View>
                  </View>
                  {mixPanelExpanded && (
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={100}
                      value={mix.affirmations * 100}
                      onValueChange={(value) => engine.setMix({ ...mix, affirmations: value / 100 })}
                      minimumTrackTintColor={theme.colors.accent.highlight}
                      maximumTrackTintColor="rgba(0, 0, 0, 0.1)"
                      thumbTintColor={theme.colors.accent.highlight}
                    />
                  )}
                </View>

                {/* Brain Layer (Binaural or Solfeggio) */}
                <View style={styles.mixControl}>
                  <View style={styles.mixControlHeader}>
                    <Text style={styles.mixControlLabel}>
                      {data?.solfeggio ? "Solfeggio Frequency" : "Binaural Frequency"}
                    </Text>
                    <View style={styles.mixControlRight}>
                      <View style={styles.mixBarContainer}>
                        <View style={[styles.mixBar, { width: `${mix.binaural * 100}%` }]} />
                      </View>
                      <Text style={styles.mixControlValue}>{getMixLabel(mix.binaural)}</Text>
                    </View>
                  </View>
                  {mixPanelExpanded && (
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={100}
                      value={mix.binaural * 100}
                      onValueChange={(value) => engine.setMix({ ...mix, binaural: value / 100 })}
                      minimumTrackTintColor={theme.colors.accent.highlight}
                      maximumTrackTintColor="rgba(0, 0, 0, 0.1)"
                      thumbTintColor={theme.colors.accent.highlight}
                    />
                  )}
                </View>

                {/* Atmosphere */}
                <View style={styles.mixControl}>
                  <View style={styles.mixControlHeader}>
                    <Text style={styles.mixControlLabel}>Atmosphere</Text>
                    <View style={styles.mixControlRight}>
                      <View style={styles.mixBarContainer}>
                        <View style={[styles.mixBar, { width: `${mix.background * 100}%` }]} />
                      </View>
                      <Text style={styles.mixControlValue}>{getMixLabel(mix.background)}</Text>
                    </View>
                  </View>
                  {mixPanelExpanded && (
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={100}
                      value={mix.background * 100}
                      onValueChange={(value) => engine.setMix({ ...mix, background: value / 100 })}
                      minimumTrackTintColor={theme.colors.accent.highlight}
                      maximumTrackTintColor="rgba(0, 0, 0, 0.1)"
                      thumbTintColor={theme.colors.accent.highlight}
                    />
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Player Menu */}
      <PlayerMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        sleepTimerDuration={sleepTimerDuration}
        onSetSleepTimer={setSleepTimer}
        onRestart={handleRestart}
        onEndSession={handleEndSession}
        onSOS={() => navigation.navigate("SOS")}
        onSaveMix={() => setSaveMixSheetOpen(true)}
      />

      {/* Save Mix Preset Sheet */}
      <SaveMixPresetSheet
        visible={saveMixSheetOpen}
        onClose={() => setSaveMixSheetOpen(false)}
        onSave={handleSaveMix}
      />

      {/* Primer Animation - shows during preroll */}
      {primerVisible && (
        <PrimerAnimation
          onComplete={() => setPrimerVisible(false)}
          duration={25000}
          skippable={true}
          onSkip={() => setPrimerVisible(false)}
        />
      )}
      </AppScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  appScreenOverlay: {
    backgroundColor: "transparent",
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundIconContainer: {
    position: "absolute",
    top: -50,
    right: -100,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: theme.spacing[6],
    paddingTop: theme.spacing[12],
    paddingBottom: theme.spacing[8],
    justifyContent: "space-between",
    zIndex: 1,
  },
  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing[4],
  },
  topNavRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  sleepTimerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.accent.highlight,
  },
  sleepTimerText: {
    ...theme.typography.styles.caption,
    color: theme.colors.accent.highlight,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  spacer: {
    flexGrow: 1,
  },
  mainCard: {
    backgroundColor: theme.colors.background.surfaceElevated,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[6],
    marginBottom: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.border.glass,
    // Soft frosted glass effect
    ...theme.shadows.glass,
  },
  sessionTitle: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 30,
    letterSpacing: -0.3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
    textAlign: "center",
  },
  sessionSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
    letterSpacing: 0.1,
    color: theme.colors.text.tertiary,
    textAlign: "center",
  },
  audioVizContainer: {
    width: "100%",
    height: 240,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing[6],
  },
  audioBar: {
    width: 4,
    borderRadius: theme.radius.full,
  },
  timeDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeLabel: {
    ...theme.typography.styles.caption,
    fontSize: theme.typography.fontSize.xs,
    letterSpacing: theme.typography.letterSpacing.widest,
    color: theme.colors.text.tertiary,
    textTransform: "uppercase",
  },
  timeValue: {
    ...theme.typography.styles.caption,
    fontSize: theme.typography.fontSize.xs,
    letterSpacing: theme.typography.letterSpacing.widest,
    color: theme.colors.text.tertiary,
    textTransform: "uppercase",
  },
  controlsCard: {
    backgroundColor: theme.colors.background.surfaceElevated,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing[4],
    marginBottom: theme.spacing[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border.glass,
    // Soft frosted glass effect
    ...theme.shadows.glass,
  },
  sessionInfoContainer: {
    backgroundColor: theme.colors.background.surfaceElevated,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[5],
    marginBottom: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.border.glass,
    alignItems: "center",
    ...theme.shadows.glass,
  },
  playButtonContainer: {
    position: "relative",
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
  },
  playButtonGlow: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent.highlight,
    ...theme.shadows.glow.highlight,
  },
  playButton: {
    width: 96,
    height: 96,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent.highlight,
    borderRadius: theme.radius.full,
    zIndex: 1,
  },
  mixPanel: {
    backgroundColor: "rgba(255, 255, 255, 0.85)", // High-blur glass effect
    borderRadius: theme.radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)", // More visible border for distinct layer
    // Soft frosted glass effect
    ...theme.shadows.glass,
  },
  mixPanelOpen: {
    backgroundColor: "rgba(255, 255, 255, 0.9)", // Slightly more opaque when open
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  mixPanelHeader: {
    width: "100%",
    padding: theme.spacing[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mixPanelHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
  },
  mixPanelTitle: {
    ...theme.typography.styles.h3,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
  },
  mixControls: {
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[6],
    paddingTop: theme.spacing[2],
    gap: theme.spacing[6],
  },
  mixControl: {
    gap: theme.spacing[2],
  },
  mixControlHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mixControlRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    flex: 1,
    justifyContent: "flex-end",
  },
  mixControlLabel: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },
  mixControlValue: {
    ...theme.typography.styles.body,
    color: theme.colors.text.tertiary,
    minWidth: 60,
    textAlign: "right",
  },
  mixBarContainer: {
    width: 60,
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: theme.radius.sm,
    marginRight: theme.spacing[3],
    overflow: "hidden",
  },
  mixBar: {
    height: 4,
    backgroundColor: theme.colors.accent.highlight,
    borderRadius: theme.radius.sm,
    minWidth: 2,
  },
  slider: {
    width: "100%",
    height: 24, // Reduced height for Apple-like compact feel
  },
  errorContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.semantic.error,
    gap: theme.spacing[3],
    marginBottom: theme.spacing[4],
  },
  errorContent: {
    flex: 1,
    gap: theme.spacing[2],
  },
  errorTitle: {
    ...theme.typography.styles.h3,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.semantic.error,
  },
  errorMessage: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },
  errorButton: {
    alignSelf: "flex-start",
    marginTop: theme.spacing[2],
  },
});
