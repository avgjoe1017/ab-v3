import { type PlaybackBundleVM } from "@ab/contracts";
import type { AudioEngineSnapshot, Mix } from "./types";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { Platform } from "react-native";

/**
 * V3 Audio Engine
 * - Process-level singleton (getAudioEngine())
 * - Orchestrates 3 players: Affirmations, Binaural, Background
 * - Manages playback state, mix levels, and looping
 */
export class AudioEngine {
  private snapshot: AudioEngineSnapshot = {
    status: "idle",
    positionMs: 0,
    durationMs: 0,
    mix: { affirmations: 1, binaural: 0.35, background: 0.35 },
  };

  private listeners = new Set<(s: AudioEngineSnapshot) => void>();
  private queue: Promise<void> = Promise.resolve();

  // Players
  private affPlayer: AudioPlayer | null = null;
  private binPlayer: AudioPlayer | null = null;
  private bgPlayer: AudioPlayer | null = null;

  // Position Polling
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Config audio module if needed (e.g. background mode)
    // For now, relies on default or app-level config
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
    this.snapshot = { ...this.snapshot, ...patch };
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
    return this.enqueue(async () => {
      this.setState({ status: "loading", sessionId: bundle.sessionId });
      this.stopPolling();

      // Teardown existing
      this.affPlayer?.release();
      this.binPlayer?.release();
      this.bgPlayer?.release();

      // V3 Compliance: Platform-aware URL selection
      const getUrl = (asset: { urlByPlatform: { ios: string, android: string } }) => {
        return Platform.OS === "ios" ? asset.urlByPlatform.ios : asset.urlByPlatform.android;
      };

      try {
        console.log("[AudioEngine] Loading Bundle:", bundle.sessionId);

        // 1. Create Players
        // Affirmations (Track A)
        this.affPlayer = createAudioPlayer({ uri: bundle.affirmationsMergedUrl });

        // Binaural (Track B)
        this.binPlayer = createAudioPlayer({ uri: getUrl(bundle.binaural) });
        this.binPlayer.loop = bundle.binaural.loop;

        // Background (Track C)
        this.bgPlayer = createAudioPlayer({ uri: getUrl(bundle.background) });
        this.bgPlayer.loop = bundle.background.loop;

        // 2. Apply Mix
        this.affPlayer.volume = bundle.mix.affirmations;
        this.binPlayer.volume = bundle.mix.binaural;
        this.bgPlayer.volume = bundle.mix.background;

        // 3. Wait for Ready (optional, simple verify duration)
        // Note: expo-audio loads lazily usually, but we can verify status?
        // Let's assume ready for V3 speed.

        // Listen to finish on Affirmations to stop all
        // Also extract duration when player loads
        this.affPlayer.addListener("playbackStatusUpdate", (status) => {
          if (status.isLoaded) {
            // V3 Compliance: Extract duration from player when loaded
            // expo-audio status may have duration in seconds, convert to ms
            if (status.duration !== undefined && status.duration > 0) {
              this.setState({ durationMs: status.duration * 1000 });
            }
            
            if (status.didJustFinish) {
              this.stop(); // Stop all when affirmations end
            }
          }
        });

        // Set initial state (duration will be updated by listener when player loads)
        this.setState({
          status: "ready",
          mix: bundle.mix,
          durationMs: 0 // Will be updated by playbackStatusUpdate listener
        });

      } catch (e) {
        console.error("Failed to load audio bundle", e);
        throw e;
      }
    });
  }

  play(): Promise<void> {
    return this.enqueue(async () => {
      if (this.snapshot.status !== "ready" && this.snapshot.status !== "paused") {
        console.warn("[AudioEngine] Cannot play from status:", this.snapshot.status);
        return;
      }

      this.affPlayer?.play();
      this.binPlayer?.play();
      this.bgPlayer?.play();

      this.startPolling();
      this.setState({ status: "playing" });
    });
  }

  pause(): Promise<void> {
    return this.enqueue(async () => {
      if (this.snapshot.status !== "playing") return;

      this.affPlayer?.pause();
      this.binPlayer?.pause();
      this.bgPlayer?.pause();

      this.stopPolling();
      this.setState({ status: "paused" });
    });
  }

  stop(): Promise<void> {
    return this.enqueue(async () => {
      this.setState({ status: "stopping" });

      this.affPlayer?.pause();
      this.affPlayer?.seekTo(0);

      this.binPlayer?.pause();
      this.binPlayer?.seekTo(0);

      this.bgPlayer?.pause();
      this.bgPlayer?.seekTo(0);

      this.stopPolling();
      this.setState({ status: "ready", positionMs: 0 }); // Back to ready, not idle, so we can re-play
    });
  }

  seek(ms: number): Promise<void> {
    return this.enqueue(async () => {
      const sec = ms / 1000;
      this.affPlayer?.seekTo(sec);
      // Do we seek B/C? Usually yes to keep sync phase if they are long tracks, 
      // but for loops it doesn't matter much. We'll sync them for correctness.
      this.binPlayer?.seekTo(sec % (this.binPlayer.duration || 1)); // Modulo loop length if known? 
      // Simpler: Just seek them too.
      this.binPlayer?.seekTo(sec);
      this.bgPlayer?.seekTo(sec);

      this.setState({ positionMs: ms });
    });
  }

  setMix(mix: Mix): void {
    // This can be sync-ish but safer in queue to avoid access race
    this.enqueue(async () => {
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
