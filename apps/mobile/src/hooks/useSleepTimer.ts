import { useState, useEffect, useRef } from "react";
import { getAudioEngine, type AudioEngineSnapshot } from "@ab/audio-engine";

export type SleepTimerDuration = 5 | 10 | 15 | 30 | 60 | null;

/**
 * Sleep timer hook
 * Automatically stops playback after the specified duration
 */
export function useSleepTimer() {
  const [duration, setDuration] = useState<SleepTimerDuration>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const clearSleepTimer = () => {
    setDuration(null);
    setTimeRemaining(null);
    startTimeRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Reset timer when playback stops
  useEffect(() => {
    const engine = getAudioEngine();
    const unsubscribe = engine.subscribe((snapshot: AudioEngineSnapshot) => {
      if (snapshot.status === "idle" && duration !== null) {
        // Playback stopped, clear timer
        setDuration(null);
        setTimeRemaining(null);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        startTimeRef.current = null;
      }
    });
    return unsubscribe;
  }, [duration]);

  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (duration === null) {
      setTimeRemaining(null);
      startTimeRef.current = null;
      return;
    }

    // Start new timer
    const durationMs = duration * 60 * 1000; // Convert minutes to ms
    startTimeRef.current = Date.now();
    setTimeRemaining(durationMs);

    timerRef.current = setInterval(() => {
      if (!startTimeRef.current) return;

      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, durationMs - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        // Timer expired - stop playback
        const engine = getAudioEngine();
        engine.stop();
        setDuration(null);
        setTimeRemaining(null);
        startTimeRef.current = null;
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }, 1000); // Update every second

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [duration]);

  const setSleepTimer = (minutes: SleepTimerDuration) => {
    setDuration(minutes);
  };

  return {
    duration,
    timeRemaining,
    setSleepTimer,
    clearSleepTimer,
  };
}

