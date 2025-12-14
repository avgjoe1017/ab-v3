import { type PlaybackBundleVM } from "@ab/contracts";
import type { AudioEngineSnapshot, Mix } from "./types";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { Platform } from "react-native";

// Pre-roll asset - this will be resolved by Metro bundler when used from mobile app
// The actual require() happens in getPrerollAssetUri() at runtime

/**
 * V3 Audio Engine
 * - Process-level singleton (getAudioEngine())
 * - Orchestrates 3 players: Affirmations, Binaural, Background
 * - Manages playback state, mix levels, and looping
 */
export class AudioEngine {
  // Build proof - if you see this timestamp, you're running the compiled version
  private static readonly BUILD_PROOF = "2025-01-14T00:00:00Z";
  
  private snapshot: AudioEngineSnapshot = {
    status: "idle",
    positionMs: 0,
    durationMs: 0,
    mix: { affirmations: 1, binaural: 0.3, background: 0.3 }, // Default to 30% for binaural and background
  };
  
  // Track if user has explicitly adjusted volumes (prevents reset on reload)
  private hasUserSetMix: boolean = false;

  private listeners = new Set<(s: AudioEngineSnapshot) => void>();
  private queue: Promise<void> = Promise.resolve();

  // Players
  private affPlayer: AudioPlayer | null = null;
  private binPlayer: AudioPlayer | null = null;
  private bgPlayer: AudioPlayer | null = null;
  private prerollPlayer: AudioPlayer | null = null; // Pre-roll atmosphere player

  // Position Polling
  private interval: ReturnType<typeof setInterval> | null = null;
  
  // Pre-roll state
  private prerollFadeOutInterval: ReturnType<typeof setInterval> | null = null;
  private currentBundle: PlaybackBundleVM | null = null;

  constructor() {
    // Config audio module if needed (e.g. background mode)
    // For now, relies on default or app-level config
    console.log("[AudioEngine] BUILD PROOF:", AudioEngine.BUILD_PROOF);
  }

  subscribe(listener: (s: AudioEngineSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  getState(): AudioEngineSnapshot {
    return this.snapshot;
  }

  private setState(patch: Partial<AudioEngineSnapshot>) {
    const oldStatus = this.snapshot.status;
    this.snapshot = { ...this.snapshot, ...patch };
    const newStatus = this.snapshot.status;
    
    // Dev-only state transition logging
    if ((typeof __DEV__ !== 'undefined' && __DEV__) || process.env.NODE_ENV !== 'production') {
      if (oldStatus !== newStatus) {
        console.log(`[AudioEngine] ${oldStatus} → ${newStatus} @ ${Date.now()}`);
      }
    }
    
    for (const l of this.listeners) l(this.snapshot);
  }

  // Serialized command queue execution
  private enqueue(fn: () => Promise<void>): Promise<void> {
    this.queue = this.queue.then(fn).catch((err) => {
      console.error("[AudioEngine] Error:", err);
      this.setState({ status: "error", error: { message: "AudioEngine error", details: err } });
    });
    return this.queue;
  }

  private startPolling() {
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => {
      if (this.affPlayer) {
        // Use affirmation player as the "master" timekeeper
        const pos = this.affPlayer.currentTime * 1000; // seconds to ms
        this.setState({ positionMs: pos });
      }
    }, 250);
  }

  private stopPolling() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  load(bundle: PlaybackBundleVM): Promise<void> {
    console.log("[AudioEngine] load() method called");
    return this.enqueue(async () => {
      console.log("[AudioEngine] load() enqueued, executing...");
      console.log("[AudioEngine] load() called, current status:", this.snapshot.status);
      
      // If switching to a different session, stop current playback first
      const isDifferentSession = this.snapshot.sessionId && this.snapshot.sessionId !== bundle.sessionId;
      if (isDifferentSession && (this.snapshot.status === "playing" || this.snapshot.status === "paused" || this.snapshot.status === "preroll")) {
        console.log("[AudioEngine] Switching sessions - stopping current playback");
        // Stop pre-roll if active
        if (this.prerollPlayer) {
          await this.stopPreroll(200);
        }
        // Stop main players
        this.affPlayer?.pause();
        this.binPlayer?.pause();
        this.bgPlayer?.pause();
        this.stopPolling();
        this.setState({ status: "idle", positionMs: 0 });
      }
      
      this.currentBundle = bundle;
      console.log("[AudioEngine] Bundle stored in currentBundle");
      
      // If we're in preroll state, keep it (don't change to loading yet)
      // Loading will happen in parallel with pre-roll
      if (this.snapshot.status !== "preroll") {
        console.log("[AudioEngine] Setting status to loading");
        this.setState({ status: "loading", sessionId: bundle.sessionId });
      }
      this.stopPolling();

      // Teardown existing main players (but keep pre-roll if active)
      this.affPlayer?.release();
      this.binPlayer?.release();
      this.bgPlayer?.release();
      // Note: We don't release pre-roll here - it continues during load

      // V3 Compliance: Platform-aware URL selection
      console.log("[AudioEngine] About to create getUrl function");
      const getUrl = (asset: { urlByPlatform: { ios: string, android: string } }) => {
        return Platform.OS === "ios" ? asset.urlByPlatform.ios : asset.urlByPlatform.android;
      };
      console.log("[AudioEngine] getUrl function created");

      try {
        console.log("[AudioEngine] Entering try block");
        console.log("[AudioEngine] Loading Bundle:", bundle.sessionId);
        console.log("[AudioEngine] About to log URLs");
        const urls = {
          affirmations: bundle.affirmationsMergedUrl,
          binaural: getUrl(bundle.binaural),
          background: getUrl(bundle.background)
        };
        console.log("[AudioEngine] URLs:", urls);

        // 1. Create Players
        // Affirmations (Track A) - V3: Should loop infinitely per Loop-and-delivery.md
        console.log("[AudioEngine] Creating affPlayer...");
        try {
          this.affPlayer = createAudioPlayer({ uri: bundle.affirmationsMergedUrl });
          this.affPlayer.loop = true; // V3: All tracks loop infinitely
          console.log("[AudioEngine] Created affPlayer successfully, loop:", this.affPlayer.loop);
        } catch (err) {
          console.error("[AudioEngine] Failed to create affPlayer:", err);
          throw new Error(`Failed to create affirmations player: ${err}`);
        }

        // Binaural (Track B)
        console.log("[AudioEngine] Creating binPlayer...");
        try {
          this.binPlayer = createAudioPlayer({ uri: getUrl(bundle.binaural) });
          this.binPlayer.loop = bundle.binaural.loop;
          console.log("[AudioEngine] Created binPlayer successfully, loop:", this.binPlayer.loop);
        } catch (err) {
          console.error("[AudioEngine] Failed to create binPlayer:", err);
          throw new Error(`Failed to create binaural player: ${err}`);
        }

        // Background (Track C)
        console.log("[AudioEngine] Creating bgPlayer...");
        try {
          this.bgPlayer = createAudioPlayer({ uri: getUrl(bundle.background) });
          this.bgPlayer.loop = bundle.background.loop;
          console.log("[AudioEngine] Created bgPlayer successfully, loop:", this.bgPlayer.loop);
        } catch (err) {
          console.error("[AudioEngine] Failed to create bgPlayer:", err);
          throw new Error(`Failed to create background player: ${err}`);
        }

        // 2. Apply Mix
        // Preserve current mix ONLY if user has explicitly adjusted it
        // This prevents volume controls from resetting when reloading the same session
        const mixToUse = this.hasUserSetMix ? this.snapshot.mix : bundle.mix;
        
        this.affPlayer.volume = mixToUse.affirmations;
        this.binPlayer.volume = mixToUse.binaural;
        this.bgPlayer.volume = mixToUse.background;
        
        // Update snapshot with the mix we're using
        this.setState({ mix: mixToUse });
        
        console.log("[AudioEngine] Set volumes (preserved user adjustments):", {
          aff: this.affPlayer.volume,
          bin: this.binPlayer.volume,
          bg: this.bgPlayer.volume
        });
        
        // Add listeners to binaural and background players to verify they're working
        this.binPlayer.addListener("playbackStatusUpdate", (status) => {
          if (status.isLoaded) {
            console.log("[AudioEngine] Binaural player status:", {
              playing: status.playing,
              volume: this.binPlayer?.volume,
              duration: status.duration
            });
          }
        });
        
        this.bgPlayer.addListener("playbackStatusUpdate", (status) => {
          if (status.isLoaded) {
            console.log("[AudioEngine] Background player status:", {
              playing: status.playing,
              volume: this.bgPlayer?.volume,
              duration: status.duration
            });
          }
        });

        // 3. Wait for Ready (optional, simple verify duration)
        // Note: expo-audio loads lazily usually, but we can verify status?
        // Let's assume ready for V3 speed.

        // Listen for playback status updates to extract duration
        // V3: Affirmations loop infinitely, so didJustFinish should not occur
        // If it does, it indicates a looping issue - log warning but don't stop
        this.affPlayer.addListener("playbackStatusUpdate", (status) => {
          console.log("[AudioEngine] Affirmations playbackStatusUpdate:", {
            isLoaded: status.isLoaded,
            playing: status.playing,
            duration: status.duration,
            currentTime: status.currentTime,
          });
          
          if (status.isLoaded) {
            console.log("[AudioEngine] Affirmations player loaded:", {
              duration: status.duration,
              playing: status.playing,
              loop: this.affPlayer?.loop
            });
            // V3 Compliance: Extract duration from player when loaded
            // expo-audio status may have duration in seconds, convert to ms
            if (status.duration !== undefined && status.duration > 0) {
              this.setState({ durationMs: status.duration * 1000 });
            }
            
            // V3: With loop=true, didJustFinish should not fire. If it does, log warning
            // Guard: Only log if duration is valid (prevents spurious triggers during buffering)
            if (status.didJustFinish && status.duration && status.duration > 0) {
              console.warn("[AudioEngine] ⚠️  Affirmations track finished but should loop! Loop property:", this.affPlayer?.loop, "Duration:", status.duration);
              // Don't stop - the track should loop automatically. This is just a diagnostic.
            }
          } else {
            console.log("[AudioEngine] Affirmations player not loaded yet:", status);
          }
        });

        // Set initial state (duration will be updated by listener when player loads)
        // If we were in preroll, we'll transition to playing via crossfade
        // Otherwise, go to ready state
        // Note: expo-audio players load asynchronously, so we mark as ready immediately
        // The actual loading happens in the background
        const targetStatus = this.snapshot.status === "preroll" ? "preroll" : "ready";
        console.log("[AudioEngine] Setting status to:", targetStatus);
        this.setState({
          status: targetStatus,
          mix: bundle.mix,
          durationMs: 0 // Will be updated by playbackStatusUpdate listener
        });
        
        // If pre-roll is active and main tracks are now ready, crossfade
        if (targetStatus === "preroll" && this.prerollPlayer) {
          // Trigger crossfade (will be handled by next play() call or can auto-trigger)
          // For now, wait for explicit play() call to crossfade
          console.log("[AudioEngine] Pre-roll active, main tracks loaded - ready for crossfade");
        }

        console.log("[AudioEngine] Bundle load complete, status:", targetStatus);

      } catch (e) {
        console.error("[AudioEngine] Failed to load audio bundle:", e);
        this.setState({ status: "error" });
        throw e;
      }
    });
  }

  // Store preroll asset URI provided by mobile app
  private prerollAssetUri: string | null = null;

  /**
   * Set the pre-roll atmosphere asset URI.
   * This must be called from the mobile app context with the resolved asset URI.
   * The mobile app should use prerollAsset.ts to get the asset module and resolve it.
   */
  setPrerollAssetUri(uri: string): void {
    this.prerollAssetUri = uri;
  }

  /**
   * Get the pre-roll atmosphere asset URI.
   * Pre-roll atmosphere is not an intro - it's designed to feel like stepping into an already-existing environment.
   * This should be a bundled local asset that's instantly available offline.
   */
  private async getPrerollAssetUri(): Promise<string> {
    if (!this.prerollAssetUri) {
      throw new Error("Pre-roll asset URI not set. Call setPrerollAssetUri() from mobile app context first.");
    }
    return this.prerollAssetUri;
  }

  /**
   * Start pre-roll atmosphere player.
   * Pre-roll starts immediately (within 100-300ms) to buy time while main tracks load.
   */
  private async startPreroll(): Promise<void> {
    if (this.prerollPlayer) return; // Already started

    try {
      const prerollUri = await this.getPrerollAssetUri();
      console.log("[AudioEngine] Starting pre-roll with URI:", prerollUri);
      this.prerollPlayer = createAudioPlayer({ uri: prerollUri });
      this.prerollPlayer.loop = true; // Loop if needed while loading
      this.prerollPlayer.volume = 0; // Start at 0 for fade-in
      
      await this.prerollPlayer.play();
      console.log("[AudioEngine] Pre-roll player started");
      
      // Fade in over 150-300ms
      this.fadePrerollVolume(0, 0.10, 250);
    } catch (error) {
      console.error("[AudioEngine] Failed to start pre-roll:", error);
      console.warn("[AudioEngine] Continuing without pre-roll");
      // Don't block playback if pre-roll fails
    }
  }

  /**
   * Fade pre-roll volume smoothly.
   */
  private fadePrerollVolume(from: number, to: number, durationMs: number): void {
    if (!this.prerollPlayer) return;
    
    // Clear any existing fade interval
    if (this.prerollFadeOutInterval) {
      clearInterval(this.prerollFadeOutInterval);
      this.prerollFadeOutInterval = null;
    }
    
    const steps = 20; // 20 steps for smooth fade
    const stepDuration = durationMs / steps;
    const stepSize = (to - from) / steps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      const volume = Math.min(0.10, from + stepSize * currentStep); // Cap at 10%
      if (this.prerollPlayer) {
        this.prerollPlayer.volume = volume;
      }

      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        if (this.prerollFadeOutInterval === fadeInterval) {
          this.prerollFadeOutInterval = null;
        }
      }
    }, stepDuration);
    
    // Track fade interval for cleanup
    this.prerollFadeOutInterval = fadeInterval;
  }

  /**
   * Stop and release pre-roll player.
   */
  private async stopPreroll(fadeOutMs: number = 300): Promise<void> {
    if (!this.prerollPlayer) return;

    // Fade out smoothly
    const currentVolume = this.prerollPlayer.volume;
    this.fadePrerollVolume(currentVolume, 0, fadeOutMs);
    
    // Wait for fade, then stop and release
    setTimeout(async () => {
      if (this.prerollPlayer) {
        await this.prerollPlayer.pause();
        this.prerollPlayer.release();
        this.prerollPlayer = null;
      }
    }, fadeOutMs + 50); // Small buffer
  }

  play(): Promise<void> {
    return this.enqueue(async () => {
      // If idle, start pre-roll immediately (within 100-300ms)
      if (this.snapshot.status === "idle") {
        this.setState({ status: "preroll" });
        await this.startPreroll();
        
        // If bundle exists, load it in parallel (pre-roll continues)
        if (this.currentBundle) {
          // Load will happen, but we don't await it here - pre-roll continues
          this.load(this.currentBundle).catch(err => {
            console.error("[AudioEngine] Failed to load bundle:", err);
          });
        }
        return; // Pre-roll is now playing, will crossfade when ready
      }

      // If in preroll state and main tracks are ready, crossfade to them
      if (this.snapshot.status === "preroll") {
        if (this.affPlayer && this.binPlayer && this.bgPlayer) {
          await this.crossfadeToMainMix();
          return;
        }
        // Main tracks not ready yet, pre-roll continues
        return;
      }
      
      // If in loading state, start pre-roll if not already started
      if (this.snapshot.status === "loading") {
        if (!this.prerollPlayer) {
          await this.startPreroll();
          this.setState({ status: "preroll" });
        }
        return; // Wait for load to complete
      }

      // Standard play from ready or paused
      // If already playing, just return (idempotent - safe to call multiple times)
      if (this.snapshot.status === "playing") {
        // Already playing, no-op (this is fine, just means user tapped Play again)
        return;
      }
      
      // If idle and no bundle, can't play (should have been handled above, but double-check)
      // Note: This check is defensive - status shouldn't be "idle" here after the checks above
      if (!this.currentBundle) {
        console.warn("[AudioEngine] Cannot play without a bundle loaded");
        return;
      }
      
      if (this.snapshot.status !== "ready" && this.snapshot.status !== "paused") {
        console.warn("[AudioEngine] Cannot play from status:", this.snapshot.status);
        return;
      }

      // If resuming from pause and pre-roll was active, restart it if needed
      if (this.snapshot.status === "paused" && !this.affPlayer) {
        // Main tracks not ready, restart pre-roll
        this.setState({ status: "preroll" });
        await this.startPreroll();
        return;
      }

      // Start main mix (may be muted initially if crossfading)
      if (!this.affPlayer || !this.binPlayer || !this.bgPlayer) {
        console.warn("[AudioEngine] Cannot play - players not loaded:", {
          aff: !!this.affPlayer,
          bin: !!this.binPlayer,
          bg: !!this.bgPlayer
        });
        return;
      }

      // If resuming from pause, just resume at current volumes (no rolling start)
      if (this.snapshot.status === "paused") {
        console.log("[AudioEngine] Resuming from pause at current volumes:", {
          aff: this.affPlayer.volume,
          bin: this.binPlayer.volume,
          bg: this.bgPlayer.volume
        });
        
        // Simply resume all players at their current volumes
        await Promise.all([
          this.affPlayer.play(),
          this.binPlayer.play(),
          this.bgPlayer.play()
        ]);
        
        this.startPolling();
        this.setState({ status: "playing" });
        console.log("[AudioEngine] Resumed playback");
        return;
      }

      // Rolling start only for initial play (from ready state)
      console.log("[AudioEngine] Playing main mix with rolling start:", {
        volumes: {
          aff: this.snapshot.mix.affirmations,
          bin: this.snapshot.mix.binaural,
          bg: this.snapshot.mix.background
        }
      });

      // Initialize all players at volume 0 for rolling start
      if (this.affPlayer) this.affPlayer.volume = 0;
      if (this.binPlayer) this.binPlayer.volume = 0;
      if (this.bgPlayer) this.bgPlayer.volume = 0;
      
      try {
        // Rolling start sequence:
        // 1. Background starts first, fades in over 3 seconds
        // 2. Binaural starts after background begins, fades in over 1 second
        // 3. Affirmations start after binaural begins (no fade, immediate)
        
        console.log("[AudioEngine] Step 1: Starting background player...");
        await this.bgPlayer!.play();
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for player to start
        
        // Verify background is playing
        if (!this.bgPlayer!.playing) {
          console.warn("[AudioEngine] ⚠️  Background player not playing, retrying...");
          await this.bgPlayer!.pause();
          await new Promise(resolve => setTimeout(resolve, 50));
          await this.bgPlayer!.play();
        }
        
        console.log("[AudioEngine] ✅ Background started, fading in over 3 seconds");
        const targetBgVolume = this.snapshot.mix.background;
        this.fadeVolume(this.bgPlayer!, 0, targetBgVolume, 3000);
        
        // Wait 1 second before starting binaural (so it starts 1s into background fade)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log("[AudioEngine] Step 2: Starting binaural player...");
        await this.binPlayer!.play();
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for player to start
        
        // Verify binaural is playing
        if (!this.binPlayer!.playing) {
          console.warn("[AudioEngine] ⚠️  Binaural player not playing, retrying...");
          await this.binPlayer!.pause();
          await new Promise(resolve => setTimeout(resolve, 50));
          await this.binPlayer!.play();
        }
        
        console.log("[AudioEngine] ✅ Binaural started, fading in over 1 second");
        const targetBinVolume = this.snapshot.mix.binaural;
        this.fadeVolume(this.binPlayer!, 0, targetBinVolume, 1000);
        
        // Wait 1 second before starting affirmations (so it starts when binaural fade completes)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log("[AudioEngine] Step 3: Starting affirmations player...");
        // Set affirmations to target volume immediately (no fade)
        if (this.affPlayer) {
          this.affPlayer.volume = this.snapshot.mix.affirmations;
        }
        await this.affPlayer!.play();
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for player to start
        
        // Verify affirmations is playing
        if (!this.affPlayer!.playing) {
          console.warn("[AudioEngine] ⚠️  Affirmations player not playing, retrying...");
          await this.affPlayer!.pause();
          await new Promise(resolve => setTimeout(resolve, 50));
          await this.affPlayer!.play();
        }
        
        console.log("[AudioEngine] ✅ All players started with rolling start sequence");
        
        // Verify all players are actually playing after a brief delay
        setTimeout(() => {
          console.log("[AudioEngine] Player status check (after 500ms):", {
            aff: { 
              playing: this.affPlayer?.playing, 
              volume: this.affPlayer?.volume,
              duration: this.affPlayer?.duration 
            },
            bin: { 
              playing: this.binPlayer?.playing, 
              volume: this.binPlayer?.volume,
              duration: this.binPlayer?.duration,
              loop: this.binPlayer?.loop
            },
            bg: { 
              playing: this.bgPlayer?.playing, 
              volume: this.bgPlayer?.volume,
              duration: this.bgPlayer?.duration,
              loop: this.bgPlayer?.loop
            }
          });
          
          // Log warnings if players aren't playing
          if (this.affPlayer && !this.affPlayer.playing) {
            console.warn("[AudioEngine] ⚠️  Affirmations player not playing after play() call!");
          }
          if (this.binPlayer && !this.binPlayer.playing) {
            console.warn("[AudioEngine] ⚠️  Binaural player not playing! Check volume and audio file.");
          }
          if (this.bgPlayer && !this.bgPlayer.playing) {
            console.warn("[AudioEngine] ⚠️  Background player not playing! Check volume and audio file.");
          }
        }, 500);
        
        this.startPolling();
        this.setState({ status: "playing" });
        console.log("[AudioEngine] All players started, status set to playing");
      } catch (error) {
        console.error("[AudioEngine] ❌ CRITICAL ERROR starting players:", error);
        console.error("[AudioEngine] Error type:", typeof error);
        console.error("[AudioEngine] Error message:", error instanceof Error ? error.message : String(error));
        console.error("[AudioEngine] Error stack:", error instanceof Error ? error.stack : "No stack");
        // Set error state but don't throw - let playback continue with available players
        this.setState({ status: "error", error: { message: error instanceof Error ? error.message : String(error) } });
        // Still start polling and set playing so UI doesn't hang
        this.startPolling();
        this.setState({ status: "playing" });
      }
    });
  }

  /**
   * Fade a single player's volume smoothly from start to target.
   */
  private fadeVolume(player: AudioPlayer, from: number, to: number, durationMs: number): void {
    const steps = 30; // More steps for smoother fade
    const stepDuration = durationMs / steps;
    const stepSize = (to - from) / steps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      const currentVolume = from + stepSize * currentStep;
      player.volume = Math.max(0, Math.min(1, currentVolume)); // Clamp to 0-1

      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        // Ensure final volume is exact
        player.volume = to;
      }
    }, stepDuration);
  }

  /**
   * Crossfade from pre-roll to main mix.
   * Pre-roll fades out over 1.5-2.0 seconds while main mix fades in.
   */
  private async crossfadeToMainMix(): Promise<void> {
    if (!this.prerollPlayer || !this.affPlayer || !this.binPlayer || !this.bgPlayer) {
      return;
    }

    const crossfadeDuration = 1750; // 1.75 seconds

    // Start main tracks at volume 0
    this.affPlayer.volume = 0;
    this.binPlayer.volume = 0;
    this.bgPlayer.volume = 0;

    // Play main tracks simultaneously (muted) for better synchronization
    await Promise.all([
      this.affPlayer.play(),
      this.binPlayer.play(),
      this.bgPlayer.play()
    ]);

    // Fade pre-roll out
    const currentPrerollVolume = this.prerollPlayer.volume;
    this.fadePrerollVolume(currentPrerollVolume, 0, crossfadeDuration);

    // Fade main mix in
    const targetMix = this.snapshot.mix;
    this.fadeMainMixVolume(0, targetMix, crossfadeDuration);

    // After crossfade, stop pre-roll
    setTimeout(async () => {
      await this.stopPreroll(0); // Already faded, just release
      this.setState({ status: "playing" });
      this.startPolling();
    }, crossfadeDuration + 100);
  }

  /**
   * Fade main mix volume smoothly to target mix levels.
   */
  private fadeMainMixVolume(from: number, targetMix: Mix, durationMs: number): void {
    const steps = 20;
    const stepDuration = durationMs / steps;
    const stepSize = 1 / steps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      const progress = from + stepSize * currentStep;

      if (this.affPlayer) {
        this.affPlayer.volume = targetMix.affirmations * progress;
      }
      if (this.binPlayer) {
        this.binPlayer.volume = targetMix.binaural * progress;
      }
      if (this.bgPlayer) {
        this.bgPlayer.volume = targetMix.background * progress;
      }

      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        // Ensure final volumes are exact
        if (this.affPlayer) this.affPlayer.volume = targetMix.affirmations;
        if (this.binPlayer) this.binPlayer.volume = targetMix.binaural;
        if (this.bgPlayer) this.bgPlayer.volume = targetMix.background;
      }
    }, stepDuration);
  }

  pause(): Promise<void> {
    return this.enqueue(async () => {
      if (this.snapshot.status !== "playing" && this.snapshot.status !== "preroll") {
        return;
      }

      // Pause main tracks if playing
      this.affPlayer?.pause();
      this.binPlayer?.pause();
      this.bgPlayer?.pause();

      // If in preroll, fade it out quickly (300-500ms)
      if (this.snapshot.status === "preroll" && this.prerollPlayer) {
        await this.stopPreroll(400);
      }

      this.stopPolling();
      this.setState({ status: "paused" });
    });
  }

  stop(): Promise<void> {
    return this.enqueue(async () => {
      this.setState({ status: "stopping" });

      // Stop pre-roll immediately with fast fade (200-300ms)
      if (this.prerollPlayer) {
        await this.stopPreroll(250);
      }

      this.affPlayer?.pause();
      this.affPlayer?.seekTo(0);

      this.binPlayer?.pause();
      this.binPlayer?.seekTo(0);

      this.bgPlayer?.pause();
      this.bgPlayer?.seekTo(0);

      this.stopPolling();
      this.setState({ status: "idle", positionMs: 0 }); // Back to idle
      // Keep currentBundle so user can play again without reloading
      // this.currentBundle = null;
    });
  }

  seek(ms: number): Promise<void> {
    return this.enqueue(async () => {
      const sec = ms / 1000;
      this.affPlayer?.seekTo(sec);
      // For looping tracks, we can seek them directly - the loop will handle wrapping
      // If duration is known, use modulo to keep them in sync with the loop length
      if (this.binPlayer) {
        const binDuration = this.binPlayer.duration || 1;
        this.binPlayer.seekTo(sec % binDuration);
      }
      if (this.bgPlayer) {
        const bgDuration = this.bgPlayer.duration || 1;
        this.bgPlayer.seekTo(sec % bgDuration);
      }

      this.setState({ positionMs: ms });
    });
  }

  setMix(mix: Mix): void {
    // This can be sync-ish but safer in queue to avoid access race
    this.enqueue(async () => {
      // Mark that user has explicitly set the mix (prevents reset on reload)
      this.hasUserSetMix = true;
      
      if (this.affPlayer) this.affPlayer.volume = mix.affirmations;
      if (this.binPlayer) this.binPlayer.volume = mix.binaural;
      if (this.bgPlayer) this.bgPlayer.volume = mix.background;
      this.setState({ mix });
    });
  }
}

// Singleton accessor (V3 rule)
let singleton: AudioEngine | null = null;
export function getAudioEngine(): AudioEngine {
  if (!singleton) singleton = new AudioEngine();
  return singleton;
}
