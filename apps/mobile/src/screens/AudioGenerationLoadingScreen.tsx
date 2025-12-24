import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, Animated, Platform } from "react-native";
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
          {/* Audio Visualizer Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="graphic-eq" size={48} color={theme.colors.accent.highlight} />
            </View>
          </View>

          {/* Loading Message */}
          <Text style={styles.loadingMessage}>Just a moment...</Text>
          <Text style={styles.mainMessage}>We're building the best{'\n'}session for you!</Text>

          {/* Progress Steps */}
          <View style={styles.progressContainer}>
            {PROGRESS_STEPS.map((step, index) => {
              const isActive = step.key === currentStep;
              const isCompleted = index < getCurrentStepIndex();
              
              return (
                <View key={step.key} style={styles.progressStep}>
                  <View
                    style={[
                      styles.radioButton,
                      isActive && styles.radioButtonActive,
                      isCompleted && styles.radioButtonCompleted,
                    ]}
                  >
                    {isCompleted && (
                      <MaterialIcons name="check" size={16} color="#ffffff" />
                    )}
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
  iconContainer: {
    marginBottom: theme.spacing[8],
    alignItems: "center",
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.accent.highlight,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.colors.accent.highlight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingMessage: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
    textAlign: "center",
  },
  mainMessage: {
    ...theme.typography.styles.h1,
    fontSize: 24,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[12],
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
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border.default,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonActive: {
    borderColor: theme.colors.accent.highlight,
    backgroundColor: theme.colors.accent.highlight,
  },
  radioButtonCompleted: {
    borderColor: theme.colors.accent.highlight,
    backgroundColor: theme.colors.accent.highlight,
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

