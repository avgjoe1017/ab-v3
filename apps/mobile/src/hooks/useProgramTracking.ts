import { useEffect } from "react";
import { getAudioEngine, type AudioEngineSnapshot } from "@ab/audio-engine";
import { markDayCompleted } from "../storage/programProgress";
import { PLACEHOLDER_PROGRAMS } from "../types/program";

/**
 * Hook to track program progress based on session completion
 * Marks a program day as completed when the corresponding session finishes
 */
export function useProgramTracking() {
  useEffect(() => {
    const engine = getAudioEngine();
    let lastSessionId: string | null = null;
    let sessionStartTime: number = 0;
    const MIN_SESSION_DURATION = 60000; // 1 minute minimum to count as completion

    const unsubscribe = engine.subscribe((snapshot: AudioEngineSnapshot) => {
      const currentSessionId = snapshot.sessionId;
      const status = snapshot.status;

      // Track when a session starts
      if (currentSessionId && currentSessionId !== lastSessionId && status === "playing") {
        lastSessionId = currentSessionId;
        sessionStartTime = Date.now();
      }

      // Check if session ended (stopped or idle after playing)
      if (
        lastSessionId &&
        currentSessionId === lastSessionId &&
        (status === "idle" || status === "stopping") &&
        sessionStartTime > 0
      ) {
        const sessionDuration = Date.now() - sessionStartTime;
        
        // Only mark as complete if session was played for at least 1 minute
        if (sessionDuration >= MIN_SESSION_DURATION) {
          // Find if this session belongs to a program day
          for (const program of PLACEHOLDER_PROGRAMS) {
            for (const day of program.days) {
              if (day.sessionId === lastSessionId) {
                // Mark this day as completed
                markDayCompleted(program.id, day.day).catch((error) => {
                  console.error("[useProgramTracking] Error marking day complete:", error);
                });
              }
            }
          }
        }

        lastSessionId = null;
        sessionStartTime = 0;
      }
    });

    return unsubscribe;
  }, []);
}

