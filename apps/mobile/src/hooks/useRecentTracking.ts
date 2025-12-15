import { useEffect } from "react";
import { getAudioEngine, type AudioEngineSnapshot } from "@ab/audio-engine";
import { addRecentSession } from "../storage/recentSessions";

/**
 * Hook to track recent sessions based on playback history
 * Adds sessions to recent list when they finish playing
 */
export function useRecentTracking() {
  useEffect(() => {
    const engine = getAudioEngine();
    let lastSessionId: string | null = null;
    let sessionStartTime: number = 0;
    let totalPlayedTime: number = 0;
    const MIN_SESSION_DURATION = 30000; // 30 seconds minimum to count as "played"

    const unsubscribe = engine.subscribe((snapshot: AudioEngineSnapshot) => {
      const currentSessionId = snapshot.sessionId;
      const status = snapshot.status;

      // Track when a session starts
      if (currentSessionId && currentSessionId !== lastSessionId && status === "playing") {
        lastSessionId = currentSessionId;
        sessionStartTime = Date.now();
        totalPlayedTime = 0;
      }

      // Accumulate play time
      if (lastSessionId && currentSessionId === lastSessionId && status === "playing") {
        totalPlayedTime = Date.now() - sessionStartTime;
      }

      // Check if session ended
      if (
        lastSessionId &&
        currentSessionId === lastSessionId &&
        (status === "idle" || status === "stopping") &&
        sessionStartTime > 0
      ) {
        // Only add to recent if played for at least 30 seconds
        if (totalPlayedTime >= MIN_SESSION_DURATION) {
          addRecentSession(lastSessionId, totalPlayedTime).catch((error) => {
            console.error("[useRecentTracking] Error adding recent session:", error);
          });
        }

        lastSessionId = null;
        sessionStartTime = 0;
        totalPlayedTime = 0;
      }
    });

    return unsubscribe;
  }, []);
}

