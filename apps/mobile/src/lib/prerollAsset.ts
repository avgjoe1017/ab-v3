/**
 * Pre-roll atmosphere asset configuration.
 * 
 * This file provides the pre-roll asset URI to the AudioEngine.
 * The asset is bundled with the app and available offline.
 */

// Import the bundled asset - Metro will resolve this at build time
// @ts-ignore - Metro will resolve this asset
const prerollAsset = require('../assets/audio/preroll_atmosphere.m4a');

/**
 * Get the pre-roll atmosphere asset URI.
 * This should be called from the mobile app and passed to AudioEngine if needed.
 */
export function getPrerollAssetUri(): string {
  // In Expo, require() returns a number (asset ID) for bundled assets
  // expo-audio can handle this directly, or we can resolve it via Asset API
  if (typeof prerollAsset === 'number') {
    // It's an asset ID, return as-is (expo-audio should handle it)
    return prerollAsset.toString();
  }
  // Otherwise, it might be a URI string
  return prerollAsset;
}

/**
 * Get the pre-roll asset module for use with Asset API if needed.
 */
export function getPrerollAssetModule() {
  return prerollAsset;
}

