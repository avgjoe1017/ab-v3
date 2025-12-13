import type { PlaybackBundleVM } from "@ab/contracts";

export type Mix = PlaybackBundleVM["mix"];

export type AudioEngineStatus =
  | "idle"
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
