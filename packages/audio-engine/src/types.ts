import type { PlaybackBundleVM } from "@ab/contracts";

export type Mix = PlaybackBundleVM["mix"];

export type AudioEngineStatus =
  | "idle"
  | "preroll"  // Pre-roll atmosphere playing while main tracks load
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "stopping"
  | "error";

export type AudioEngineSnapshot = {
  status: AudioEngineStatus;
  sessionId?: string;
  positionMs: number;
  durationMs: number;
  mix: Mix;
  error?: { message: string; details?: unknown };
};
