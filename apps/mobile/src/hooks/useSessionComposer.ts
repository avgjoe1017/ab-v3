/**
 * Session Composer Hook
 * 
 * Single source of truth for:
 * - Goal/context capture
 * - Planning (basic heuristics now, swap to LLM later without touching UI)
 * - Generation (POST /affirmations/generate)
 * - Session creation (POST /sessions) + title dedupe (GET /sessions)
 * - Edit/overwrite affirmations
 * - Solfeggio selection passed to backend via solfeggioHz
 */

import { useState, useCallback, useMemo } from "react";
import { useAuthToken } from "../lib/auth";
import { getUserStruggle } from "../lib/values";
import { apiGet, apiPost } from "../lib/api";
import type { SessionV3 } from "@ab/contracts";
import {
  decideAudioSettings,
  packToSessionPayload,
  type AffirmationPack,
  type AudioSettings,
  type BrainLayerType,
} from "../lib/affirmationPack";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ComposerPhase =
  | "idle"
  | "planning"
  | "generating"
  | "ready"
  | "creating"
  | "error";

export interface ComposerPlan {
  sessionType: string;
  goalTag?: string;
  suggestedLength: 6 | 12 | 18 | 24;
  suggestedBrainLayer: BrainLayerType;
  suggestedSolfeggioHz?: number;
}

export interface ComposerState {
  phase: ComposerPhase;
  goal: string;
  context: string;
  length: 6 | 12 | 18 | 24;
  plan: ComposerPlan | null;
  pack: AffirmationPack | null;
  reasoning?: string;
  error?: string;
}

export interface ComposerActions {
  setGoal: (text: string) => void;
  setContext: (text: string) => void;
  setLength: (n: 6 | 12 | 18 | 24) => void;
  setAudioSettings: (settings: Partial<AudioSettings>) => void;
  generate: () => Promise<void>;
  updateAffirmations: (next: string[]) => void;
  createSession: () => Promise<{ sessionId: string } | null>;
  reset: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Planner (deterministic heuristics - can swap for LLM later)
// ─────────────────────────────────────────────────────────────────────────────

function inferSessionType(goal: string): string {
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
  
  return "Meditate"; // Default
}

function inferGoalTag(sessionType: string): string | undefined {
  const tagMap: Record<string, string> = {
    "Focus": "focus",
    "Sleep": "sleep",
    "Anxiety Relief": "anxiety-relief",
    "Meditate": "meditate",
    "Wake Up": "wake-up",
    "Confidence": "pre-performance",
    "Creativity": "creativity",
  };
  return tagMap[sessionType];
}

function inferBrainLayer(sessionType: string): BrainLayerType {
  // All session types benefit from binaural by default
  return "binaural";
}

function inferSolfeggioHz(goalTag: string | undefined): number | undefined {
  // Map goalTag to solfeggio frequency based on contracts/session-frequency.ts
  const solfeggioMap: Record<string, number> = {
    "focus": 741,
    "sleep": 528,
    "anxiety-relief": 852,
    "meditate": 963,
    "wake-up": 396,
    "creativity": 741,
    "pre-performance": 528,
  };
  return goalTag ? solfeggioMap[goalTag] : undefined;
}

function createPlan(goal: string): ComposerPlan {
  const sessionType = inferSessionType(goal);
  const goalTag = inferGoalTag(sessionType);
  
  return {
    sessionType,
    goalTag,
    suggestedLength: 12, // Default to 12 affirmations
    suggestedBrainLayer: inferBrainLayer(sessionType),
    suggestedSolfeggioHz: inferSolfeggioHz(goalTag),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useSessionComposer(): ComposerState & ComposerActions {
  const authToken = useAuthToken();
  
  // Core state
  const [phase, setPhase] = useState<ComposerPhase>("idle");
  const [goal, setGoalState] = useState("");
  const [context, setContextState] = useState("");
  const [length, setLengthState] = useState<6 | 12 | 18 | 24>(12);
  const [pack, setPack] = useState<AffirmationPack | null>(null);
  const [reasoning, setReasoning] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  
  // Derived plan (recomputed when goal changes)
  const plan = useMemo(() => {
    if (!goal.trim()) return null;
    return createPlan(goal);
  }, [goal]);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────────────────
  
  const setGoal = useCallback((text: string) => {
    setGoalState(text);
    setError(undefined);
    // Reset to idle when goal changes significantly
    if (phase === "ready" || phase === "error") {
      setPhase("idle");
      setPack(null);
    }
  }, [phase]);
  
  const setContext = useCallback((text: string) => {
    setContextState(text);
  }, []);
  
  const setLength = useCallback((n: 6 | 12 | 18 | 24) => {
    setLengthState(n);
  }, []);
  
  const setAudioSettings = useCallback((settings: Partial<AudioSettings>) => {
    if (pack) {
      setPack({
        ...pack,
        audioSettings: { ...pack.audioSettings, ...settings },
      });
    }
  }, [pack]);
  
  const generate = useCallback(async () => {
    if (!goal.trim() || goal.length < 2) {
      setError("Goal must be at least 2 characters");
      return;
    }
    if (goal.length > 140) {
      setError("Goal must be 140 characters or less");
      return;
    }
    
    try {
      setPhase("generating");
      setError(undefined);
      
      // Fetch user struggle for additional context
      let userStruggle: string | undefined;
      try {
        const struggleResponse = await getUserStruggle(authToken);
        userStruggle = struggleResponse.struggle || undefined;
      } catch (err) {
        console.log("[useSessionComposer] Could not fetch user struggle");
      }
      
      // Get session type from plan
      const sessionType = plan?.sessionType || "Meditate";
      
      // Generate affirmations
      const response = await apiPost<{ affirmations: string[]; reasoning?: string }>(
        "/affirmations/generate",
        {
          sessionType,
          struggle: userStruggle || context || undefined,
          goal,
          count: length,
        },
        authToken
      );
      
      // Auto-select audio settings based on goal
      const audioSettings = decideAudioSettings(goal);
      
      // Create pack
      const newPack: AffirmationPack = {
        goal,
        context: context || undefined,
        affirmations: response.affirmations,
        style: "balanced",
        length,
        audioSettings,
      };
      
      setPack(newPack);
      setReasoning(response.reasoning);
      setPhase("ready");
    } catch (err) {
      console.error("[useSessionComposer] Failed to generate:", err);
      setError(err instanceof Error ? err.message : "Could not generate affirmations. Please try again.");
      setPhase("error");
    }
  }, [goal, context, length, plan, authToken]);
  
  const updateAffirmations = useCallback((next: string[]) => {
    if (pack) {
      setPack({ ...pack, affirmations: next });
    }
  }, [pack]);
  
  const createSession = useCallback(async (): Promise<{ sessionId: string } | null> => {
    if (!pack) {
      setError("No pack to create session from");
      return null;
    }
    
    try {
      setPhase("creating");
      setError(undefined);
      
      // Fetch user's existing sessions to get used titles (for deduplication)
      let usedTitles: string[] = [];
      try {
        const sessionsResponse = await apiGet<{ sessions: Array<{ title: string }> }>("/sessions", authToken);
        usedTitles = sessionsResponse.sessions
          .filter(s => s.title)
          .map(s => s.title);
      } catch (err) {
        console.log("[useSessionComposer] Could not fetch user sessions for title deduplication:", err);
      }
      
      // Build payload with solfeggioHz if applicable
      const basePayload = packToSessionPayload(pack, usedTitles);
      
      // Add solfeggioHz if using solfeggio brain layer
      const payload: typeof basePayload & { solfeggioHz?: number } = { ...basePayload };
      if (pack.audioSettings.brainLayerType === "solfeggio" && pack.audioSettings.brainLayerPreset) {
        const hz = Number(pack.audioSettings.brainLayerPreset);
        if (!isNaN(hz) && hz > 0) {
          payload.solfeggioHz = hz;
        }
      }
      
      // Create session
      const res = await apiPost<SessionV3>("/sessions", payload, authToken);
      
      return { sessionId: res.id };
    } catch (err) {
      console.error("[useSessionComposer] Failed to create session:", err);
      setError(err instanceof Error ? err.message : "Could not create session. Please try again.");
      setPhase("error");
      return null;
    }
  }, [pack, authToken]);
  
  const reset = useCallback(() => {
    setPhase("idle");
    setGoalState("");
    setContextState("");
    setLengthState(12);
    setPack(null);
    setReasoning(undefined);
    setError(undefined);
  }, []);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────────────────────────
  
  return {
    // State
    phase,
    goal,
    context,
    length,
    plan,
    pack,
    reasoning,
    error,
    // Actions
    setGoal,
    setContext,
    setLength,
    setAudioSettings,
    generate,
    updateAffirmations,
    createSession,
    reset,
  };
}

