/**
 * Drift Corrector Module
 * Handles synchronization of looping audio tracks to prevent drift
 */

import type { AudioPlayer } from "expo-audio";

/**
 * Drift correction - align beds to affirmations track
 * Only corrects if drift is significant (>200ms) to avoid audible gaps
 */
export function correctDrift(
  affPlayer: AudioPlayer | null,
  binPlayer: AudioPlayer | null,
  bgPlayer: AudioPlayer | null
): void {
  if (!affPlayer || !binPlayer || !bgPlayer) return;

  const affTime = affPlayer.currentTime;
  const binDuration = binPlayer.duration || 1;
  const bgDuration = bgPlayer.duration || 1;

  // Check binaural drift - only correct if drift is significant to avoid gaps
  const binTime = binPlayer.currentTime;
  const binExpected = affTime % binDuration;
  const binDrift = Math.abs(binTime - binExpected);
  
  // Increased threshold to 200ms - only correct significant drift to avoid audible gaps
  if (binDrift > 0.2) {
    console.log(`[DriftCorrector] Correcting binaural drift: ${(binDrift * 1000).toFixed(0)}ms`);
    binPlayer.seekTo(binExpected);
  }

  // Check background drift - only correct if drift is significant
  const bgTime = bgPlayer.currentTime;
  const bgExpected = affTime % bgDuration;
  const bgDrift = Math.abs(bgTime - bgExpected);
  
  // Increased threshold to 200ms - only correct significant drift to avoid audible gaps
  if (bgDrift > 0.2) {
    console.log(`[DriftCorrector] Correcting background drift: ${(bgDrift * 1000).toFixed(0)}ms`);
    bgPlayer.seekTo(bgExpected);
  }
}

