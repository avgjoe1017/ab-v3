/**
 * V3 Audio Engine
 * - Process-level singleton (getAudioEngine())
 * - Orchestrates 3 players: Affirmations, Binaural, Background
 * - Manages playback state, mix levels, and looping
 * 
 * Refactored to use modular components:
 * - AudioSession: Audio session configuration
 * - PlayerManager: Player lifecycle management
 * - PrerollManager: Pre-roll atmosphere handling
 * - MixerController: Mix automation, crossfade, control loop
 * - DriftCorrector: Drift correction for looping tracks
 */

import { type PlaybackBundleVM } from "@ab/contracts";
import type { AudioEngineSnapshot, Mix } from "./types";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { Platform } from "react-native";
import { VoiceActivityDucker } from "./ducking";
import { AudioSession } from "./AudioSession";
import { waitForPlayerReady, waitForPlayersReady } from "./PlayerManager";
import { PrerollManager } from "./PrerollManager";
import { MixerController } from "./MixerController";
import { correctDrift } from "./DriftCorrector";

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

  // Position Polling (250ms for UI)
  private interval: ReturnType<typeof setInterval> | null = null;
  
  // Control Tick Loop (25ms for mixer/ducking/smoothing)
  private controlInterval: ReturnType<typeof setInterval> | null = null;
  
  // Current bundle
  private currentBundle: PlaybackBundleVM | null = null;
  
  // Modular components
  private audioSession: AudioSession;
  private prerollManager: PrerollManager;
  private mixerController: MixerController;
  
  // Drift correction
  private lastDriftCheck: number = 0;
  
  // Track last restart attempts to avoid spamming play() calls
  private lastBinRestartAttempt: number = 0;
  private lastBgRestartAttempt: number = 0;

  constructor() {
    console.log("[AudioEngine] BUILD PROOF:", AudioEngine.BUILD_PROOF);
    
    // Initialize modular components
    this.audioSession = new AudioSession();
    this.prerollManager = new PrerollManager();
    this.mixerController = new MixerController();
    
    // Connect preroll smoother to mixer controller
    this.mixerController.setPrerollSmoother(this.prerollManager.getSmoother());
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

  /**
   * Start control tick loop (25ms) for mixer, ducking, smoothing
   * Runs only when preroll or playing
   */
  private startControlLoop() {
    if (this.controlInterval) return; // Already running
    
    this.controlInterval = setInterval(() => {
      this.controlTick();
    }, 25); // 40 Hz control rate
  }

  private stopControlLoop() {
    if (this.controlInterval) {
      clearInterval(this.controlInterval);
      this.controlInterval = null;
    }
  }

  /**
   * Control tick - delegates to MixerController
   * Called every 25ms when playing or prerolling
   */
  private controlTick(): void {
    const status = this.snapshot.status;
    const positionMs = this.snapshot.positionMs;

    // Only run control loop during preroll or playing
    if (status !== "preroll" && status !== "playing") {
      return;
    }

    // Delegate to mixer controller
    const { crossfadeComplete } = this.mixerController.controlTick(
      status,
      positionMs,
      this.snapshot.mix,
      this.affPlayer,
      this.binPlayer,
      this.bgPlayer,
      this.prerollManager.getPlayer()
    );

    // Handle crossfade completion
    if (crossfadeComplete) {
      this.mixerController.completeCrossfade();
      const prerollPlayer = this.prerollManager.getPlayer();
      if (prerollPlayer) {
        prerollPlayer.pause();
        prerollPlayer.release();
      }
      this.prerollManager.stop(0); // Clean up
      this.setState({ status: "playing" });
    }

    // Ensure players stay playing (handle buffering gaps)
    // Check if players stopped playing unexpectedly (due to buffering or other issues)
    // Only check every 500ms to avoid spamming play() calls
    const now = Date.now();
    if (status === "playing") {
      // Check binaural player (debounced - only try restart every 500ms)
      if (this.binPlayer && !this.binPlayer.playing && this.binPlayer.duration > 0) {
        if (now - this.lastBinRestartAttempt > 500) {
          this.lastBinRestartAttempt = now;
          // Player stopped but should be playing - likely due to buffering
          console.warn("[AudioEngine] ⚠️  Binaural player stopped unexpectedly - restarting");
          this.binPlayer.play().catch(err => {
            console.error("[AudioEngine] Error restarting binaural player:", err);
          });
        }
      }
      
      // Check background player (debounced - only try restart every 500ms)
      if (this.bgPlayer && !this.bgPlayer.playing && this.bgPlayer.duration > 0) {
        if (now - this.lastBgRestartAttempt > 500) {
          this.lastBgRestartAttempt = now;
          // Player stopped but should be playing - likely due to buffering
          console.warn("[AudioEngine] ⚠️  Background player stopped unexpectedly - restarting");
          this.bgPlayer.play().catch(err => {
            console.error("[AudioEngine] Error restarting background player:", err);
          });
        }
      }
    }

    // Drift correction (every 10 seconds - less frequent to avoid gaps)
    // Skip drift correction for the first 30 seconds to avoid gaps during intro
    const sessionStartTime = this.mixerController.getSessionStartTime();
    const timeSinceStart = sessionStartTime > 0 ? Date.now() - sessionStartTime : Infinity;
    if (status === "playing" && timeSinceStart > 30000 && Date.now() - this.lastDriftCheck > 10000) {
      correctDrift(this.affPlayer, this.binPlayer, this.bgPlayer);
      this.lastDriftCheck = Date.now();
    }
  }

  load(bundle: PlaybackBundleVM): Promise<void> {
    console.log("[AudioEngine] load() method called");
    return this.enqueue(async () => {
      // Ensure audio session is configured before loading
      await this.audioSession.ensureConfigured();
      
      console.log("[AudioEngine] load() enqueued, executing...");
      console.log("[AudioEngine] load() called, current status:", this.snapshot.status);
      
      // If switching to a different session, stop current playback first
      const isDifferentSession = this.snapshot.sessionId && this.snapshot.sessionId !== bundle.sessionId;
      if (isDifferentSession && (this.snapshot.status === "playing" || this.snapshot.status === "paused" || this.snapshot.status === "preroll")) {
        console.log("[AudioEngine] Switching sessions - stopping current playback");
        // Stop pre-roll if active
        if (this.prerollManager.isActive()) {
          await this.prerollManager.stop(200);
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
      
      // Initialize voice activity ducker if available
      let ducker: VoiceActivityDucker | null = null;
      if (bundle.voiceActivity && bundle.voiceActivity.segments) {
        ducker = new VoiceActivityDucker(bundle.voiceActivity.segments);
        console.log(`[AudioEngine] Voice activity ducker initialized with ${bundle.voiceActivity.segments.length} segments`);
      }
      this.mixerController.setDucker(ducker);
      
      // Reset automation state for new session
      this.mixerController.resetAutomation();
      
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
      const getUrl = (asset: { urlByPlatform: { ios: string, android: string } }) => {
        return Platform.OS === "ios" ? asset.urlByPlatform.ios : asset.urlByPlatform.android;
      };

      try {
        console.log("[AudioEngine] Loading Bundle:", bundle.sessionId);
        const urls = {
          affirmations: bundle.affirmationsMergedUrl,
          binaural: getUrl(bundle.binaural),
          background: getUrl(bundle.background)
        };
        console.log("[AudioEngine] URLs:", urls);

        // DEBUG: Test URL reachability before creating players
        console.log("[AudioEngine] Testing URL reachability...");
        for (const [name, url] of Object.entries(urls)) {
          try {
            console.log(`[AudioEngine] Testing ${name}: ${url}`);
            const response = await fetch(url, { method: "HEAD" });
            console.log(`[AudioEngine] ✅ ${name} reachable: ${response.status} ${response.statusText}`);
            console.log(`[AudioEngine]    Content-Type: ${response.headers.get("content-type")}`);
            console.log(`[AudioEngine]    Content-Length: ${response.headers.get("content-length")}`);
          } catch (fetchError) {
            console.error(`[AudioEngine] ❌ ${name} NOT reachable:`, fetchError);
            console.error(`[AudioEngine]    URL was: ${url}`);
          }
        }
        console.log("[AudioEngine] URL reachability test complete");

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
        
        // Add listeners to binaural and background players to handle gapless looping and buffering
        // Monitor for gaps during playback (especially around 30 seconds) caused by buffering issues
        this.binPlayer.addListener("playbackStatusUpdate", (status) => {
          if (status.isLoaded && status.duration && status.duration > 0) {
            // Detect buffering state - if player stops playing due to buffering, restart it
            const isBuffering = (status as any).isBuffering === true;
            const shouldBePlaying = this.snapshot.status === "playing";
            
            // If we should be playing but player stopped, and it's due to buffering, restart
            if (shouldBePlaying && !status.playing && isBuffering && this.binPlayer) {
              console.warn("[AudioEngine] ⚠️  Binaural player stopped due to buffering - restarting playback");
              this.binPlayer.play().catch(err => {
                console.error("[AudioEngine] Error restarting binaural player after buffering:", err);
              });
            }
            
            // Handle didJustFinish - immediately seek to 0 to restart playback seamlessly
            // This prevents gaps that occur when expo-audio's loop property doesn't work perfectly
            // With loop=true, didJustFinish shouldn't normally fire, but if it does, we handle it
            if (status.didJustFinish && this.binPlayer) {
              // Immediately seek to 0 to restart the loop
              this.binPlayer.seekTo(0);
              // Ensure player continues playing (loop=true should handle this, but ensure it)
              if (!this.binPlayer.playing) {
                this.binPlayer.play().catch(err => {
                  console.error("[AudioEngine] Error restarting binaural player after loop:", err);
                });
              }
              console.log("[AudioEngine] Binaural loop transition - seeking to 0 to prevent gap");
            }
            
            // Log buffering events for debugging (only occasionally to avoid spam)
            if (isBuffering && Math.random() < 0.1) { // Log ~10% of buffering events
              console.log("[AudioEngine] Binaural buffering - currentTime:", status.currentTime, "duration:", status.duration);
            }
          }
        });
        
        this.bgPlayer.addListener("playbackStatusUpdate", (status) => {
          if (status.isLoaded && status.duration && status.duration > 0) {
            // Detect buffering state - if player stops playing due to buffering, restart it
            const isBuffering = (status as any).isBuffering === true;
            const shouldBePlaying = this.snapshot.status === "playing";
            
            // If we should be playing but player stopped, and it's due to buffering, restart
            if (shouldBePlaying && !status.playing && isBuffering && this.bgPlayer) {
              console.warn("[AudioEngine] ⚠️  Background player stopped due to buffering - restarting playback");
              this.bgPlayer.play().catch(err => {
                console.error("[AudioEngine] Error restarting background player after buffering:", err);
              });
            }
            
            // Handle didJustFinish - immediately seek to 0 to restart playback seamlessly
            // This prevents gaps that occur when expo-audio's loop property doesn't work perfectly
            // With loop=true, didJustFinish shouldn't normally fire, but if it does, we handle it
            if (status.didJustFinish && this.bgPlayer) {
              // Immediately seek to 0 to restart the loop
              this.bgPlayer.seekTo(0);
              // Ensure player continues playing (loop=true should handle this, but ensure it)
              if (!this.bgPlayer.playing) {
                this.bgPlayer.play().catch(err => {
                  console.error("[AudioEngine] Error restarting background player after loop:", err);
                });
              }
              console.log("[AudioEngine] Background loop transition - seeking to 0 to prevent gap");
            }
            
            // Log buffering events for debugging (only occasionally to avoid spam)
            if (isBuffering && Math.random() < 0.1) { // Log ~10% of buffering events
              console.log("[AudioEngine] Background buffering - currentTime:", status.currentTime, "duration:", status.duration);
            }
          }
        });

        // 3. Note: expo-audio loads files when play() is called, not when players are created
        // We can't wait for duration here since it won't be available until after play()
        console.log("[AudioEngine] Players created, will verify loading when play() is called");

        // Listen for playback status updates to extract duration
        // V3: Affirmations loop infinitely, so didJustFinish should not occur
        // If it does, it indicates a looping issue - log warning but don't stop
        this.affPlayer.addListener("playbackStatusUpdate", (status) => {
          console.log("[AudioEngine] Affirmations playbackStatusUpdate:", {
            isLoaded: status.isLoaded,
            playing: status.playing,
            duration: status.duration,
            currentTime: status.currentTime,
            error: (status as any).error,
          });
          
          if ((status as any).error) {
            console.error("[AudioEngine] ❌ Affirmations player error:", (status as any).error);
          }
          
          if (status.isLoaded) {
            console.log("[AudioEngine] ✅ Affirmations player loaded:", {
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
        if (targetStatus === "preroll" && this.prerollManager.isActive()) {
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

  /**
   * Set the pre-roll atmosphere asset URI.
   * This must be called from the mobile app context with the resolved asset URI.
   * The mobile app should use prerollAsset.ts to get the asset module and resolve it.
   */
  setPrerollAssetUri(uri: string): void {
    this.prerollManager.setPrerollAssetUri(uri);
  }

  play(): Promise<void> {
    return this.enqueue(async () => {
      // Ensure audio session is configured before playing
      await this.audioSession.ensureConfigured();
      
      // If idle, start pre-roll immediately (within 100-300ms)
      if (this.snapshot.status === "idle") {
        this.setState({ status: "preroll" });
        await this.prerollManager.start();
        
        // If bundle exists, load it in parallel (pre-roll continues)
        if (this.currentBundle) {
          // Load will happen, but we don't await it here - pre-roll continues
          this.load(this.currentBundle).catch(err => {
            console.error("[AudioEngine] Failed to load bundle:", err);
          });
        }
        this.startControlLoop();
        return; // Pre-roll is now playing, will crossfade when ready
      }

      // If in preroll state and main tracks are ready, crossfade to them
      if (this.snapshot.status === "preroll") {
        if (this.affPlayer && this.binPlayer && this.bgPlayer) {
          await this.crossfadeToMainMix();
          return;
        }
        // Main tracks not ready yet, pre-roll continues
        // Start control loop for preroll
        this.startControlLoop();
        return;
      }
      
      // If in loading state, start pre-roll if not already started
      if (this.snapshot.status === "loading") {
        if (!this.prerollManager.isActive()) {
          await this.prerollManager.start();
          this.setState({ status: "preroll" });
          this.startControlLoop(); // Start control loop for preroll
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
        await this.prerollManager.start();
        this.startControlLoop();
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
        
        this.mixerController.startIntroAutomation(); // Restart intro automation
        this.startControlLoop();
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
      // Use smoothers for smooth intro automation
      this.mixerController.resetSmoothers(0);
      
      if (this.affPlayer) this.affPlayer.volume = 0;
      if (this.binPlayer) this.binPlayer.volume = 0;
      if (this.bgPlayer) this.bgPlayer.volume = 0;
      
      try {
        // Rolling start sequence:
        // 1. Background starts first, fades in over 3 seconds
        // 2. Binaural starts after background begins, fades in over 1 second
        // 3. Affirmations start after binaural begins (no fade, immediate)
        
        // Get URLs from currentBundle for logging
        const getUrl = this.currentBundle ? ((asset: { urlByPlatform: { ios: string, android: string } }) => {
          return Platform.OS === "ios" ? asset.urlByPlatform.ios : asset.urlByPlatform.android;
        }) : null;
        
        console.log("[AudioEngine] Step 1: Starting background player...");
        const bgUrl = this.currentBundle && getUrl ? getUrl(this.currentBundle.background) : "unknown";
        console.log("[AudioEngine] Background URL:", bgUrl);
        
        try {
          // Call play() to trigger loading
          console.log("[AudioEngine] Calling play() on background player...");
          await this.bgPlayer!.play();
          console.log("[AudioEngine] Background play() called, waiting for ready...");
          
          // Wait for ready with shorter timeout - network files should load quickly from S3
          try {
            await waitForPlayerReady(this.bgPlayer!, "Background", 5000); // Reduced to 5s
          } catch (waitError) {
            console.warn("[AudioEngine] ⚠️  Background waitForPlayerReady timed out, but continuing anyway");
            // Don't wait - just continue
          }
          
          // Quick retry if not playing
          if (!this.bgPlayer!.playing) {
            await this.bgPlayer!.play();
            await new Promise(resolve => setTimeout(resolve, 200)); // Reduced wait
          }
          
          if (this.bgPlayer!.playing) {
            console.log("[AudioEngine] ✅ Background started, intro automation will fade in over 4s");
          } else {
            console.error("[AudioEngine] ❌ Background player failed to start after multiple attempts!");
            console.error("[AudioEngine] Check if audio file exists and is accessible:", bgUrl);
            // Continue anyway - control loop will handle it
            console.warn("[AudioEngine] Continuing playback - background may start later");
          }
        } catch (error) {
          console.error("[AudioEngine] ❌ Error starting background player:", error);
          console.error("[AudioEngine] Audio file URL:", bgUrl);
          // Continue anyway - don't block other players
        }
        
        // Brief pause before starting binaural (staggered start)
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log("[AudioEngine] Step 2: Starting binaural player...");
        const binUrl = this.currentBundle && getUrl ? getUrl(this.currentBundle.binaural) : "unknown";
        console.log("[AudioEngine] Binaural URL:", binUrl);
        
        try {
          // Call play() to trigger loading
          console.log("[AudioEngine] Calling play() on binaural player...");
          await this.binPlayer!.play();
          console.log("[AudioEngine] Binaural play() called, waiting for ready...");
          
          // Wait for ready with shorter timeout
          try {
            await waitForPlayerReady(this.binPlayer!, "Binaural", 5000); // Reduced to 5s
          } catch (waitError) {
            console.warn("[AudioEngine] ⚠️  Binaural waitForPlayerReady timed out, but continuing anyway");
            // Don't wait - just continue
          }
          
          // Quick retry if not playing
          if (!this.binPlayer!.playing) {
            await this.binPlayer!.play();
            await new Promise(resolve => setTimeout(resolve, 200)); // Reduced wait
          }
          
          if (this.binPlayer!.playing) {
            console.log("[AudioEngine] ✅ Binaural started, intro automation will fade in over 4s (after 2s delay)");
          } else {
            console.error("[AudioEngine] ❌ Binaural player failed to start after multiple attempts!");
            console.error("[AudioEngine] Check if audio file exists and is accessible:", binUrl);
            // Continue anyway - control loop will handle it
            console.warn("[AudioEngine] Continuing playback - binaural may start later");
          }
        } catch (error) {
          console.error("[AudioEngine] ❌ Error starting binaural player:", error);
          console.error("[AudioEngine] Audio file URL:", binUrl);
          // Continue anyway - don't block other players
        }
        
        // Brief pause before starting affirmations (staggered start)
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log("[AudioEngine] Step 3: Starting affirmations player...");
        const affUrl = this.currentBundle?.affirmationsMergedUrl || "unknown";
        
        try {
          // Call play() to trigger loading, then wait for it to be ready
          await this.affPlayer!.play();
          
          // Wait for ready with shorter timeout
          try {
            await waitForPlayerReady(this.affPlayer!, "Affirmations", 5000); // Reduced to 5s
          } catch (waitError) {
            console.warn("[AudioEngine] ⚠️  Affirmations waitForPlayerReady timed out, but continuing anyway");
            // Don't wait - just continue
          }
          
          // Quick retry if not playing
          if (!this.affPlayer!.playing) {
            await this.affPlayer!.play();
            await new Promise(resolve => setTimeout(resolve, 200)); // Reduced wait
          }
          
          if (this.affPlayer!.playing) {
            console.log("[AudioEngine] ✅ Affirmations started");
          } else {
            console.error("[AudioEngine] ❌ Affirmations player failed to start after loading!");
            console.error("[AudioEngine] Check if file exists and is accessible:", affUrl);
          }
        } catch (error) {
          console.error("[AudioEngine] ❌ Error starting affirmations player:", error);
          console.error("[AudioEngine] Audio file URL:", affUrl);
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
        
        // Start control loop and position polling
        this.mixerController.startIntroAutomation(); // Start intro automation
        this.startControlLoop();
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
   * Crossfade from pre-roll to main mix using equal-power curve and control loop.
   * Pre-roll fades out over 1.75 seconds while main mix fades in.
   */
  private async crossfadeToMainMix(): Promise<void> {
    if (!this.prerollManager.isActive() || !this.affPlayer || !this.binPlayer || !this.bgPlayer) {
      return;
    }

    const crossfadeDuration = 1750; // 1.75 seconds

    // Initialize main tracks at volume 0 (control loop will fade them in)
    this.mixerController.resetSmoothers(0);
    
    // Initialize preroll smoother at current volume
    const prerollPlayer = this.prerollManager.getPlayer();
    if (prerollPlayer) {
      const prerollSmoother = this.mixerController.getSmoothers().preroll;
      if (prerollSmoother) {
        prerollSmoother.reset(prerollPlayer.volume);
      }
    }

    // Play main tracks simultaneously (muted initially, control loop will fade in)
    // Call play() to trigger loading
    await Promise.all([
      this.affPlayer.play(),
      this.binPlayer.play(),
      this.bgPlayer.play()
    ]);

    // Wait for all players to be ready before starting crossfade
    console.log("[AudioEngine] Waiting for main tracks to load before crossfade...");
    try {
      await waitForPlayersReady(this.affPlayer, this.binPlayer, this.bgPlayer);
      console.log("[AudioEngine] ✅ All main tracks loaded, starting crossfade");
    } catch (error) {
      console.error("[AudioEngine] ❌ Error waiting for main tracks to load:", error);
      // Continue anyway - players may still work
    }

    // Start crossfade (control loop will handle the equal-power curve)
    this.mixerController.startCrossfade(crossfadeDuration);

    // Start control loop to drive crossfade
    this.startControlLoop();
    this.startPolling();
    
    // After crossfade completes, control loop will clean up preroll
    // Status will be set to "playing" by control loop when crossfade finishes
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
      if (this.snapshot.status === "preroll" && this.prerollManager.isActive()) {
        await this.prerollManager.stop(400);
      }

      this.stopControlLoop();
      this.stopPolling();
      this.setState({ status: "paused" });
    });
  }

  stop(): Promise<void> {
    return this.enqueue(async () => {
      this.setState({ status: "stopping" });

      // Stop pre-roll immediately with fast fade (200-300ms)
      if (this.prerollManager.isActive()) {
        await this.prerollManager.stop(250);
      }

      this.affPlayer?.pause();
      this.affPlayer?.seekTo(0);

      this.binPlayer?.pause();
      this.binPlayer?.seekTo(0);

      this.bgPlayer?.pause();
      this.bgPlayer?.seekTo(0);

      this.stopControlLoop();
      this.stopPolling();
      // Reset automation
      this.mixerController.resetAutomation();
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

  setMix(mix: Mix, opts?: { rampMs?: number; source?: "user" | "system" }): void {
    // Mark that user has explicitly set the mix (prevents reset on reload)
    if (opts?.source === "user" || opts === undefined) {
      this.hasUserSetMix = true;
    }
    
    // Update snapshot mix (control loop will apply with smoothing)
    this.setState({ mix });
    
    // If control loop is running, it will smoothly transition
    // If not, set volumes directly (for immediate feedback when not playing)
    if (this.snapshot.status !== "playing" && this.snapshot.status !== "preroll") {
      if (this.affPlayer) this.affPlayer.volume = mix.affirmations;
      if (this.binPlayer) this.binPlayer.volume = mix.binaural;
      if (this.bgPlayer) this.bgPlayer.volume = mix.background;
    }
    // Otherwise, control loop will handle smooth transition
  }

  /**
   * Set voice prominence (convenience method)
   * Maps a single slider (0..1) to a mix where voice is always at 1.0
   * and beds scale inversely
   */
  setVoiceProminence(x: number): void {
    const clamped = Math.max(0, Math.min(1, x));
    const mix: Mix = {
      affirmations: 1.0,
      background: 0.18 + (0.38 - 0.18) * (1 - clamped), // Lerp from 0.38 to 0.18
      binaural: 0.14 + (0.32 - 0.14) * (1 - clamped),   // Lerp from 0.32 to 0.14
    };
    this.setMix(mix, { source: "user" });
  }
}

// Singleton accessor (V3 rule)
let singleton: AudioEngine | null = null;
export function getAudioEngine(): AudioEngine {
  if (!singleton) singleton = new AudioEngine();
  return singleton;
}
