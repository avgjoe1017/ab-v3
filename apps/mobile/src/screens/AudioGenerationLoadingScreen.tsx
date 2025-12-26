import React, { useEffect, useState, useMemo, useRef } from "react";
import { View, Text, StyleSheet, Animated, Platform, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, ApiError } from "../lib/api";
import { PlaybackBundleVMSchema, type PlaybackBundleVM } from "@ab/contracts";
import { getAudioEngine } from "@ab/audio-engine";
import { theme } from "../theme";
import { getBackgroundAssetUri } from "../lib/bundledAssets";
import { AppScreen } from "../components";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";

type ProgressStep = "analyzing" | "generating" | "finalizing";

interface ProgressStepConfig {
  key: ProgressStep;
  label: string;
  description: string;
}

const PROGRESS_STEPS: ProgressStepConfig[] = [
  {
    key: "analyzing",
    label: "Analyzing your intention",
    description: "Understanding your goals and values",
  },
  {
    key: "generating",
    label: "Generating your affirmations",
    description: "Creating personalized audio content",
  },
  {
    key: "finalizing",
    label: "Finalizing your session",
    description: "Preparing everything for you",
  },
];

export default function AudioGenerationLoadingScreen({ route, navigation }: any) {
  const sessionId: string = route.params.sessionId;
  const queryClient = useQueryClient();
  const engine = useMemo(() => getAudioEngine(), []);

  const [currentStep, setCurrentStep] = useState<ProgressStep>("analyzing");
  const [jobId, setJobId] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(1));
  
  // Early track player (background only - started before affirmations ready)
  const [earlyBgPlayer, setEarlyBgPlayer] = useState<AudioPlayer | null>(null);
  
  // Breathing orb animations (same as player screen - this is the player seed)
  const orbScaleAnim = useRef(new Animated.Value(1)).current;
  const orbOpacityAnim = useRef(new Animated.Value(0.5)).current;
  const shimmerOpacityAnim = useRef(new Animated.Value(0.3)).current;

  // Fetch session details for metadata
  const { data: sessionData } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const res = await apiGet<any>(`/sessions/${sessionId}`);
      return res;
    },
  });

  // Start audio generation job
  useEffect(() => {
    const startGeneration = async () => {
      try {
        // Step 1: Start background track early (only background, not binaural)
        setCurrentStep("analyzing");
        await startEarlyTracks();

        // Small delay for UX (let user see the first step)
        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 2: Trigger audio generation
        setCurrentStep("generating");
        const response = await apiPost<{ status: string; jobId?: string }>(
          `/sessions/${sessionId}/ensure-audio`,
          {}
        );

        if (response.status === "ready") {
          // Audio already ready, skip to finalizing
          setCurrentStep("finalizing");
          await new Promise(resolve => setTimeout(resolve, 800));
          navigateToPlayer();
          return;
        }

        if (response.jobId) {
          setJobId(response.jobId);
          // Poll for completion
          await pollJobStatus(response.jobId);
        } else {
          // No job ID, try fetching bundle directly
          await checkBundleReady();
        }
      } catch (error) {
        console.error("[LoadingScreen] Error in generation:", error);
        // On error, still try to navigate to player (it will show error state)
        navigateToPlayer();
      }
    };

    startGeneration();
  }, [sessionId]);

  // Start background track early (before affirmations are ready)
  // Only plays background, not binaural - binaural will start when full bundle loads
  // Uses bundled assets directly - they're always available in the app
  const startEarlyTracks = async () => {
    try {
      if (!sessionData) return;

      // Get bundled background asset URI (always available in the app)
      const backgroundUri = await getBackgroundAssetUri("Babbling Brook"); // Default background

      console.log("[LoadingScreen] Starting background track early...");

      // Start background player directly with expo-audio
      // This will play independently until the full bundle is ready in the player screen
      const bgPlayer = createAudioPlayer({ uri: backgroundUri });
      bgPlayer.loop = true;
      bgPlayer.volume = 0.2; // Start at 20% volume
      
      // Start playback
      await bgPlayer.play();
      
      setEarlyBgPlayer(bgPlayer);
      
      console.log("[LoadingScreen] ✅ Started background track early");
    } catch (error) {
      console.error("[LoadingScreen] Error preparing early track:", error);
      // Don't fail - continue with generation
    }
  };

  // Poll job status
  const pollJobStatus = async (jobIdToPoll: string) => {
    let attempts = 0;
    const maxAttempts = 120; // 2 minutes max (1 second intervals)

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const jobResponse = await apiGet<{ job: { status: string; error?: string } }>(
          `/jobs/${jobIdToPoll}`
        );

        if (jobResponse.job.status === "completed") {
          setCurrentStep("finalizing");
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Invalidate bundle query and check if ready
          queryClient.invalidateQueries({ queryKey: ["playback-bundle", sessionId] });
          await checkBundleReady();
          return;
        } else if (jobResponse.job.status === "failed") {
          throw new Error(jobResponse.job.error || "Audio generation failed");
        }
        // Continue polling if still processing
      } catch (err) {
        console.error("[LoadingScreen] Error polling job:", err);
        // Continue polling on transient errors
      }

      attempts++;
    }

    // Timeout - try to navigate anyway (maybe generation finished but polling had issues)
    console.warn("[LoadingScreen] Polling timeout, checking bundle anyway...");
    await checkBundleReady();
  };

  // Check if bundle is ready and navigate
  const checkBundleReady = async () => {
    try {
      // Small delay to ensure bundle is available
      await new Promise(resolve => setTimeout(resolve, 500));

      // Try to fetch bundle
      const bundleRes = await apiGet<{ bundle: PlaybackBundleVM }>(
        `/sessions/${sessionId}/playback-bundle`
      );
      const bundle = PlaybackBundleVMSchema.parse(bundleRes.bundle);

      // Bundle is ready!
      navigateToPlayer();
    } catch (error: any) {
      if (error instanceof ApiError && error.code === "AUDIO_NOT_READY") {
        // Still not ready, wait a bit more and try again
        console.log("[LoadingScreen] Bundle still not ready, waiting...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        await checkBundleReady();
      } else {
        // Other error - navigate anyway (player will show error)
        console.error("[LoadingScreen] Error checking bundle:", error);
        navigateToPlayer();
      }
    }
  };

  // Fade out early players smoothly (crossfade to AudioEngine players)
  const fadeOutEarlyPlayers = async () => {
    const fadeDuration = 2000; // 2 seconds crossfade
    const steps = 40;
    const stepDelay = fadeDuration / steps;
    
    const fadeOutPlayer = async (player: AudioPlayer | null) => {
      if (!player) return;
      
      try {
        const startVol = player.volume || 0.2;
        for (let i = 0; i <= steps; i++) {
          const vol = startVol * (1 - i / steps);
          player.volume = vol;
          await new Promise(resolve => setTimeout(resolve, stepDelay));
        }
        // Fade complete, stop and release
        player.pause();
        player.release();
        console.log("[LoadingScreen] ✅ Faded out early player");
      } catch (error) {
        console.error("[LoadingScreen] Error fading out early player:", error);
        // If fade fails, just stop it
        try {
          player.pause();
          player.release();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
    
    // Start fade-out in background (don't await - let it continue during/after navigation)
    if (earlyBgPlayer) {
      fadeOutPlayer(earlyBgPlayer).catch(console.error);
    }
  };

  // Navigate to player with fade animation
  // Early players will fade out smoothly after AudioEngine starts
  const navigateToPlayer = () => {
    // Start fading out early players (they'll continue fading during/after navigation)
    // Give AudioEngine 500ms to start playing before beginning the fade
    setTimeout(() => {
      fadeOutEarlyPlayers();
    }, 500);
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      // Replace this screen with player (no back button)
      navigation.replace("Player", { sessionId });
    });
  };
  
  // Cleanup: fade out early player if component unmounts unexpectedly
  useEffect(() => {
    return () => {
      // If component unmounts before navigateToPlayer is called, fade out here
      if (earlyBgPlayer) {
        fadeOutEarlyPlayers();
      }
    };
  }, []);

  const getCurrentStepIndex = () => {
    return PROGRESS_STEPS.findIndex(step => step.key === currentStep);
  };

  const currentStepConfig = PROGRESS_STEPS.find(step => step.key === currentStep) || PROGRESS_STEPS[0];

  // Breathing orb animation - very slow breathing (±3–4% scale on 7s loop)
  useEffect(() => {
    const breathingAnimation = Animated.loop(
      Animated.sequence([
        // Breathe in (inhale) - 3.5s
        Animated.parallel([
          Animated.timing(orbScaleAnim, {
            toValue: 1.035, // +3.5% scale
            duration: 3500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(orbOpacityAnim, {
            toValue: 0.6,
            duration: 3500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        // Breathe out (exhale) - 3.5s
        Animated.parallel([
          Animated.timing(orbScaleAnim, {
            toValue: 0.965, // -3.5% scale
            duration: 3500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(orbOpacityAnim, {
            toValue: 0.4,
            duration: 3500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    breathingAnimation.start();
    return () => breathingAnimation.stop();
  }, [orbScaleAnim, orbOpacityAnim]);

  // Shimmer opacity animation during "generating" step
  useEffect(() => {
    if (currentStep === "generating") {
      const shimmerAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerOpacityAnim, {
            toValue: 0.6,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(shimmerOpacityAnim, {
            toValue: 0.3,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      shimmerAnimation.start();
      return () => shimmerAnimation.stop();
    } else {
      // Reset shimmer when not generating
      Animated.timing(shimmerOpacityAnim, {
        toValue: 0.3,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [currentStep, shimmerOpacityAnim]);

  return (
    <AppScreen gradient={false} style={styles.screen}>
      <LinearGradient
        colors={["#f5f5f5", "#ffffff"]}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Breathing Orb - Same as Player Screen (Player Seed) */}
          <View style={styles.orbContainer}>
            <Animated.View
              style={[
                styles.orbCircle,
                {
                  transform: [{ scale: orbScaleAnim }],
                  opacity: orbOpacityAnim,
                },
              ]}
            >
              <View style={styles.orbInnerCircle} />
            </Animated.View>
            {/* Shimmer overlay during generating */}
            {currentStep === "generating" && (
              <Animated.View
                style={[
                  styles.orbShimmer,
                  {
                    opacity: shimmerOpacityAnim,
                  },
                ]}
              />
            )}
          </View>

          {/* Loading Message */}
          {currentStep === "generating" ? (
            <>
              <Animated.Text
                style={[
                  styles.loadingMessage,
                  {
                    opacity: shimmerOpacityAnim.interpolate({
                      inputRange: [0.3, 0.6],
                      outputRange: [0.6, 1],
                    }),
                  },
                ]}
              >
                Generating...
              </Animated.Text>
            </>
          ) : (
            <Text style={styles.loadingMessage}>Just a moment...</Text>
          )}

          {/* Progress Steps */}
          <View style={styles.progressContainer}>
            {PROGRESS_STEPS.map((step, index) => {
              const isActive = step.key === currentStep;
              const isCompleted = index < getCurrentStepIndex();
              
              return (
                <View key={step.key} style={styles.progressStep}>
                  <View
                    style={[
                      styles.progressDot,
                      isActive && styles.progressDotActive,
                      isCompleted && styles.progressDotCompleted,
                    ]}
                  >
                    {/* Soft filled dot - no checkmark */}
                  </View>
                  <View style={styles.stepTextContainer}>
                    <Text
                      style={[
                        styles.stepLabel,
                        isActive && styles.stepLabelActive,
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>
      </LinearGradient>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "transparent",
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing[6],
  },
  orbContainer: {
    width: "100%",
    height: 240,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing[8],
    position: "relative",
  },
  orbCircle: {
    width: 180, // Same size as player screen
    height: 180,
    borderRadius: 90,
    backgroundColor: theme.colors.accent.highlight,
    alignItems: "center",
    justifyContent: "center",
  },
  orbInnerCircle: {
    width: 90, // Same as player screen
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.colors.background.primary,
    opacity: 0.3,
  },
  orbShimmer: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: theme.colors.accent.highlight,
    opacity: 0.2,
  },
  loadingMessage: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[8],
    textAlign: "center",
  },
  progressContainer: {
    width: "100%",
    gap: theme.spacing[6],
  },
  progressStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[4],
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.border.default,
    opacity: 0.4,
  },
  progressDotActive: {
    backgroundColor: theme.colors.accent.highlight,
    opacity: 0.8,
    // Subtle glow for active state
    shadowColor: theme.colors.accent.highlight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 2,
  },
  progressDotCompleted: {
    backgroundColor: theme.colors.accent.highlight,
    opacity: 0.6,
    // Softer glow for completed state
    shadowColor: theme.colors.accent.highlight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 1,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepLabel: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  stepLabelActive: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});

