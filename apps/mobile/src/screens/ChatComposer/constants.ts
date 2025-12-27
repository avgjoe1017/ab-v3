/**
 * Chat Composer Constants
 * One place for "suggested choices" and simple planner defaults
 */

import type { ChipAction } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Goal Presets
// ─────────────────────────────────────────────────────────────────────────────

export const GOAL_PRESETS: ChipAction[] = [
  { id: "goal-sleep", label: "Sleep better", kind: "presetGoal", payload: "I want to sleep better and feel more rested" },
  { id: "goal-focus", label: "Focus & work", kind: "presetGoal", payload: "I need to focus and be more productive" },
  { id: "goal-calm", label: "Calm anxiety", kind: "presetGoal", payload: "I'm feeling anxious and need to calm down" },
  { id: "goal-confidence", label: "Build confidence", kind: "presetGoal", payload: "I want to feel more confident in myself" },
  { id: "goal-morning", label: "Morning energy", kind: "presetGoal", payload: "I want to start my day with energy and motivation" },
  { id: "goal-meditate", label: "Meditate", kind: "presetGoal", payload: "I want to meditate and be more present" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Length Options
// ─────────────────────────────────────────────────────────────────────────────

export const LENGTH_OPTIONS: ChipAction[] = [
  { id: "length-6", label: "Quick (6)", kind: "setLength", payload: 6 },
  { id: "length-12", label: "Standard (12)", kind: "setLength", payload: 12, primary: true },
  { id: "length-18", label: "Deep (18)", kind: "setLength", payload: 18 },
  { id: "length-24", label: "Extended (24)", kind: "setLength", payload: 24 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Brain Layer Options
// ─────────────────────────────────────────────────────────────────────────────

export const BRAIN_LAYER_OPTIONS: ChipAction[] = [
  { id: "brain-binaural", label: "Binaural", kind: "setBrainLayer", payload: "binaural", primary: true },
  { id: "brain-solfeggio", label: "Solfeggio", kind: "setBrainLayer", payload: "solfeggio" },
  { id: "brain-off", label: "Off", kind: "setBrainLayer", payload: "off" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Voice Options
// ─────────────────────────────────────────────────────────────────────────────

export const VOICE_OPTIONS: ChipAction[] = [
  { id: "voice-nova", label: "Nova", kind: "setVoice", payload: "nova", primary: true },
  { id: "voice-shimmer", label: "Shimmer", kind: "setVoice", payload: "shimmer" },
  { id: "voice-alloy", label: "Alloy", kind: "setVoice", payload: "alloy" },
  { id: "voice-onyx", label: "Onyx", kind: "setVoice", payload: "onyx" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Background Options (subset for quick selection)
// ─────────────────────────────────────────────────────────────────────────────

export const BACKGROUND_OPTIONS: ChipAction[] = [
  { id: "bg-brook", label: "Babbling Brook", kind: "setBackground", payload: "Babbling Brook", primary: true },
  { id: "bg-rain", label: "Forest Rain", kind: "setBackground", payload: "Forest Rain" },
  { id: "bg-ocean", label: "Distant Ocean", kind: "setBackground", payload: "Distant Ocean" },
  { id: "bg-birds", label: "Birds Chirping", kind: "setBackground", payload: "Birds Chirping" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Session Ready Actions
// ─────────────────────────────────────────────────────────────────────────────

export const SESSION_READY_ACTIONS: ChipAction[] = [
  { id: "action-edit", label: "Edit", kind: "edit", icon: "edit" },
  { id: "action-audio", label: "Audio", kind: "audio", icon: "tune" },
  { id: "action-start", label: "Start Session", kind: "start", primary: true, icon: "play-arrow" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Assistant Messages
// ─────────────────────────────────────────────────────────────────────────────

export const OPENER_MESSAGE = "What would you like to work on today?";
export const GENERATING_MESSAGE = "Creating your personalized affirmations...";
export const READY_MESSAGE = "Your session is ready! Here's a preview:";
export const ERROR_MESSAGE = "Something went wrong. Let's try again.";

// ─────────────────────────────────────────────────────────────────────────────
// Infer session type from goal (same logic as useSessionComposer)
// ─────────────────────────────────────────────────────────────────────────────

export function inferSessionType(goal: string): string {
  const goalLower = goal.toLowerCase();
  
  if (goalLower.includes("focus") || goalLower.includes("work") || goalLower.includes("concentration") || goalLower.includes("discipline") || goalLower.includes("productive")) {
    return "Focus";
  }
  if (goalLower.includes("sleep") || goalLower.includes("rest") || goalLower.includes("night") || goalLower.includes("insomnia")) {
    return "Sleep";
  }
  if (goalLower.includes("anxiety") || goalLower.includes("calm") || goalLower.includes("stress") || goalLower.includes("overwhelm") || goalLower.includes("nervous")) {
    return "Anxiety Relief";
  }
  if (goalLower.includes("meditat") || goalLower.includes("mindful") || goalLower.includes("present") || goalLower.includes("breathe")) {
    return "Meditate";
  }
  if (goalLower.includes("wake") || goalLower.includes("morning") || goalLower.includes("energy") || goalLower.includes("motivation")) {
    return "Wake Up";
  }
  if (goalLower.includes("confidence") || goalLower.includes("confident") || goalLower.includes("imposter") || goalLower.includes("self-esteem")) {
    return "Confidence";
  }
  if (goalLower.includes("creative") || goalLower.includes("creativity") || goalLower.includes("create") || goalLower.includes("art") || goalLower.includes("write")) {
    return "Creativity";
  }
  
  return "Meditate";
}

// ─────────────────────────────────────────────────────────────────────────────
// Goal tag to solfeggio Hz mapping (from contracts)
// ─────────────────────────────────────────────────────────────────────────────

export function getSolfeggioForGoalTag(goalTag: string | undefined): number | undefined {
  if (!goalTag) return undefined;
  
  const solfeggioMap: Record<string, number> = {
    "focus": 741,
    "sleep": 528,
    "anxiety-relief": 852,
    "meditate": 963,
    "wake-up": 396,
    "creativity": 741,
    "pre-performance": 528,
  };
  
  return solfeggioMap[goalTag];
}

