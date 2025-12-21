/**
 * Affirmation Pack Model and "Decide for me" logic
 * Shared between Quick Generate and Guided paths
 */

import { randomUUID } from "expo-crypto";

export type AffirmationStyle = "grounded" | "confident" | "gentle" | "focus" | "balanced";

export type BrainLayerType = "binaural" | "solfeggio" | "off";

export type VoiceId = "alloy" | "shimmer" | "onyx" | "nova";

export interface AudioSettings {
  voiceId: VoiceId;
  brainLayerType: BrainLayerType;
  brainLayerPreset?: string; // e.g., "Calm" (10Hz), "Focus" (13.5Hz), solfeggio frequency
  backgroundId: string; // e.g., "Babbling Brook", "Forest Rain"
  mix: {
    affirmations: number;
    binaural: number;
    background: number;
  };
}

export interface AffirmationPack {
  goal: string;
  context?: string;
  affirmations: string[];
  style: AffirmationStyle;
  length: 6 | 12 | 18 | 24; // number of affirmations
  audioSettings: AudioSettings;
  createdAt?: string;
}

/**
 * "Decide for me" logic - Auto-select audio settings based on goal text
 */
export function decideAudioSettings(goal: string, userHistory?: { solfeggioFrequent?: boolean }): AudioSettings {
  const goalLower = goal.toLowerCase();

  // Voice selection
  let voiceId: VoiceId = "nova"; // Default: warm/neutral
  if (goalLower.includes("sleep") || goalLower.includes("rest") || goalLower.includes("calm")) {
    voiceId = "shimmer"; // Softer, slower voice for sleep
  }

  // Brain layer selection
  let brainLayerType: BrainLayerType = "binaural";
  let brainLayerPreset: string | undefined = "Calm"; // Default: 10Hz Alpha

  if (goalLower.includes("sleep") || goalLower.includes("rest") || goalLower.includes("calm") || goalLower.includes("anxiety")) {
    brainLayerType = "binaural";
    brainLayerPreset = "Calm"; // 10Hz Alpha for calm/sleep
  } else if (goalLower.includes("focus") || goalLower.includes("work") || goalLower.includes("concentration") || goalLower.includes("discipline")) {
    brainLayerType = "binaural";
    brainLayerPreset = "Focus"; // 13.5Hz SMR for focus
  } else if (userHistory?.solfeggioFrequent) {
    // If user often chooses Solfeggio, pick matching mood
    if (goalLower.includes("sleep") || goalLower.includes("calm")) {
      brainLayerType = "solfeggio";
      brainLayerPreset = "396"; // Solfeggio for liberation/fear
    } else {
      brainLayerType = "solfeggio";
      brainLayerPreset = "528"; // Solfeggio for transformation/love
    }
  }

  // Background selection
  let backgroundId = "Babbling Brook"; // Default: neutral
  if (goalLower.includes("night") || goalLower.includes("sleep") || goalLower.includes("rest")) {
    backgroundId = "Babbling Brook"; // Brown noise equivalent (calming)
  } else if (goalLower.includes("stress") || goalLower.includes("anxiety") || goalLower.includes("overwhelm")) {
    backgroundId = "Forest Rain"; // Rain is calming
  } else if (goalLower.includes("focus") || goalLower.includes("work") || goalLower.includes("concentration")) {
    backgroundId = "Babbling Brook"; // Neutral noise for focus
  }

  return {
    voiceId,
    brainLayerType,
    brainLayerPreset,
    backgroundId,
    mix: {
      affirmations: 1,
      binaural: brainLayerType === "binaural" ? 0.3 : 0,
      background: 0.3,
    },
  };
}

/**
 * Map brain layer preset to actual frequency/asset
 */
export function getBrainLayerAsset(preset: string, type: BrainLayerType): { hz?: number; solfeggio?: string } {
  if (type === "binaural") {
    const presetMap: Record<string, number> = {
      "Calm": 10, // Alpha 10Hz
      "Focus": 13.5, // SMR 13.5Hz
      "Sleep": 3, // Delta 3Hz
      "Energy": 20, // Beta 20Hz
    };
    return { hz: presetMap[preset] || 10 };
  } else if (type === "solfeggio") {
    return { solfeggio: preset }; // e.g., "396", "528"
  }
  return {};
}

/**
 * Convert AffirmationPack to session creation payload (DraftSession format)
 */
export function packToSessionPayload(pack: AffirmationPack): {
  localDraftId: string;
  title: string;
  goalTag?: string;
  affirmations: string[];
  voiceId: string;
  pace: "slow";
} {
  // Extract goal tag from goal text (simple keyword matching)
  let goalTag: string | undefined;
  const goalLower = pack.goal.toLowerCase();
  if (goalLower.includes("focus") || goalLower.includes("work") || goalLower.includes("concentration")) {
    goalTag = "focus";
  } else if (goalLower.includes("sleep") || goalLower.includes("rest")) {
    goalTag = "sleep";
  } else if (goalLower.includes("anxiety") || goalLower.includes("calm")) {
    goalTag = "anxiety-relief";
  } else if (goalLower.includes("meditate") || goalLower.includes("meditation")) {
    goalTag = "meditate";
  }

  return {
    localDraftId: randomUUID(), // Generate a UUID for the draft
    title: pack.goal.length > 50 ? pack.goal.substring(0, 47) + "..." : pack.goal,
    goalTag,
    affirmations: pack.affirmations,
    voiceId: pack.audioSettings.voiceId,
    pace: "slow", // Required by DraftSessionSchema
  };
}

