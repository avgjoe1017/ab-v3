/**
 * Bundled Asset Resolver
 * 
 * Maps asset identifiers to local bundled assets.
 * These assets are bundled with the app for faster loading and offline support.
 */

import { Asset } from "expo-asset";

// Binaural asset identifier -> local asset mapping
// Format: { identifier: require(path) }
// Identifier format: "alpha_10hz_400_3min" -> "alpha_10hz_400_3min.m4a"
const BINAURAL_ASSETS: Record<string, any> = {
  "alpha_10hz_400_3min": require("../../assets/audio/binaural/alpha_10hz_400_3min.m4a"),
  "alpha_12hz_120_3min": require("../../assets/audio/binaural/alpha_12hz_120_3min.m4a"),
  "beta_13hz_400_3min": require("../../assets/audio/binaural/beta_13hz_400_3min.m4a"),
  "beta_20hz_120_3min": require("../../assets/audio/binaural/beta_20hz_120_3min.m4a"),
  "delta_1hz_100_3min": require("../../assets/audio/binaural/delta_1hz_100_3min.m4a"),
  "delta_2hz_120_3min": require("../../assets/audio/binaural/delta_2hz_120_3min.m4a"),
  "delta_4hz_400_3min": require("../../assets/audio/binaural/delta_4hz_400_3min.m4a"),
  "gamma_38hz_100_3min": require("../../assets/audio/binaural/gamma_38hz_100_3min.m4a"),
  "gamma_40hz_120_3min": require("../../assets/audio/binaural/gamma_40hz_120_3min.m4a"),
  "gamma_42hz_400_3min": require("../../assets/audio/binaural/gamma_42hz_400_3min.m4a"),
  "theta_4hz_400_3min": require("../../assets/audio/binaural/theta_4hz_400_3min.m4a"),
  "theta_8hz_120_3min": require("../../assets/audio/binaural/theta_8hz_120_3min.m4a"),
  // Fallback mappings for common Hz values
  "10": require("../../assets/audio/binaural/alpha_10hz_400_3min.m4a"),
  "7": require("../../assets/audio/binaural/theta_4hz_400_3min.m4a"), // Closest Theta
  "13.5": require("../../assets/audio/binaural/beta_13hz_400_3min.m4a"), // SMR
  "3": require("../../assets/audio/binaural/delta_4hz_400_3min.m4a"), // Closest Delta
};

// Background asset identifier -> local asset mapping
const BACKGROUND_ASSETS: Record<string, any> = {
  "Babbling Brook": require("../../assets/audio/background/looped/Babbling Brook.m4a"),
  "Birds Chirping": require("../../assets/audio/background/looped/Birds Chirping.m4a"),
  "Distant Ocean": require("../../assets/audio/background/looped/Distant Ocean.m4a"),
  "Evening Walk": require("../../assets/audio/background/looped/Evening Walk.m4a"),
  "Forest Rain": require("../../assets/audio/background/looped/Forest Rain.m4a"),
  "Heavy Rain": require("../../assets/audio/background/looped/Heavy Rain.m4a"),
  "Regeneration": require("../../assets/audio/background/looped/Regeneration.m4a"),
  "Storm": require("../../assets/audio/background/looped/Storm.m4a"),
  "Thunder": require("../../assets/audio/background/looped/Thunder.m4a"),
  "Tibetan Om": require("../../assets/audio/background/looped/Tibetan Om.m4a"),
};

// Solfeggio asset identifier -> local asset mapping
const SOLFEGGIO_ASSETS: Record<string, any> = {
  "solfeggio_174_3min": require("../../assets/audio/solfeggio/solfeggio_174_3min.m4a"),
  "solfeggio_285_3min": require("../../assets/audio/solfeggio/solfeggio_285_3min.m4a"),
  "solfeggio_396_3min": require("../../assets/audio/solfeggio/solfeggio_396_3min.m4a"),
  "solfeggio_40_3min": require("../../assets/audio/solfeggio/solfeggio_40_3min.m4a"),
  "solfeggio_417_3min": require("../../assets/audio/solfeggio/solfeggio_417_3min.m4a"),
  "solfeggio_432_3min": require("../../assets/audio/solfeggio/solfeggio_432_3min.m4a"),
  "solfeggio_528_3min": require("../../assets/audio/solfeggio/solfeggio_528_3min.m4a"),
  "solfeggio_639_3min": require("../../assets/audio/solfeggio/solfeggio_639_3min.m4a"),
  "solfeggio_741_3min": require("../../assets/audio/solfeggio/solfeggio_741_3min.m4a"),
  "solfeggio_852_3min": require("../../assets/audio/solfeggio/solfeggio_852_3min.m4a"),
  "solfeggio_963_3min": require("../../assets/audio/solfeggio/solfeggio_963_3min.m4a"),
};

/**
 * Get binaural asset URI from identifier or Hz value
 * 
 * @param identifier - Asset identifier (e.g., "alpha_10hz_400_3min") or Hz value (e.g., 10)
 * @returns Local asset URI (can be used with expo-av Audio.Sound)
 */
export async function getBinauralAssetUri(identifier: string | number): Promise<string> {
  const key = typeof identifier === "number" ? identifier.toString() : identifier.replace(/\.m4a$/, "");
  
  // Try exact match first
  if (BINAURAL_ASSETS[key]) {
    const asset = Asset.fromModule(BINAURAL_ASSETS[key]);
    await asset.downloadAsync();
    return asset.localUri || asset.uri;
  }
  
  // Try to find by Hz value (fallback)
  const hzStr = key.split("_")[0]?.replace(/[^\d.]/g, "");
  if (hzStr && BINAURAL_ASSETS[hzStr]) {
    const asset = Asset.fromModule(BINAURAL_ASSETS[hzStr]);
    await asset.downloadAsync();
    return asset.localUri || asset.uri;
  }
  
  // Default to 10Hz Alpha
  const defaultAsset = Asset.fromModule(BINAURAL_ASSETS["10"]);
  await defaultAsset.downloadAsync();
  return defaultAsset.localUri || defaultAsset.uri;
}

/**
 * Get background asset URI from identifier
 * 
 * @param identifier - Background identifier (e.g., "Babbling Brook")
 * @returns Local asset URI
 */
export async function getBackgroundAssetUri(identifier: string): Promise<string> {
  const key = identifier || "Babbling Brook";
  
  if (BACKGROUND_ASSETS[key]) {
    const asset = Asset.fromModule(BACKGROUND_ASSETS[key]);
    await asset.downloadAsync();
    return asset.localUri || asset.uri;
  }
  
  // Default to "Babbling Brook"
  const defaultAsset = Asset.fromModule(BACKGROUND_ASSETS["Babbling Brook"]);
  await defaultAsset.downloadAsync();
  return defaultAsset.localUri || defaultAsset.uri;
}

/**
 * Get solfeggio asset URI from identifier
 * 
 * @param identifier - Solfeggio identifier (e.g., "solfeggio_432_3min")
 * @returns Local asset URI
 */
export async function getSolfeggioAssetUri(identifier: string): Promise<string> {
  const key = identifier.replace(/\.m4a$/, "");
  
  if (SOLFEGGIO_ASSETS[key]) {
    const asset = Asset.fromModule(SOLFEGGIO_ASSETS[key]);
    await asset.downloadAsync();
    return asset.localUri || asset.uri;
  }
  
  // Default to 432Hz (most common)
  const defaultAsset = Asset.fromModule(SOLFEGGIO_ASSETS["solfeggio_432_3min"]);
  await defaultAsset.downloadAsync();
  return defaultAsset.localUri || defaultAsset.uri;
}

/**
 * Extract asset identifier from URL
 * For binaural: extracts filename (e.g., "alpha_10hz_400_3min") or Hz value
 * For background: extracts filename (e.g., "Babbling Brook")
 * For solfeggio: extracts filename (e.g., "solfeggio_432_3min")
 */
export function extractAssetIdentifier(url: string, type: "binaural" | "background" | "solfeggio"): string | number {
  // If it's already a local URI or identifier (doesn't contain path separators or protocol), return as-is
  if (!url.includes("/") && !url.includes("http") && !url.includes("\\")) {
    return url;
  }
  
  // Extract filename from URL (handle both http URLs and local file paths)
  // Remove query parameters and anchors
  const urlWithoutQuery = url.split("?")[0].split("#")[0];
  const filename = urlWithoutQuery.split("/").pop() || urlWithoutQuery.split("\\").pop() || "";
  const withoutExt = filename.replace(/\.m4a$/i, "");
  
  if (type === "binaural") {
    // First, try to match known binaural filename patterns
    // Patterns: alpha_10hz_400_3min, beta_13hz_400_3min, delta_3hz_400_3min, etc.
    if (BINAURAL_ASSETS[withoutExt]) {
      return withoutExt;
    }
    
    // Try to extract Hz value for fallback mapping
    const hzMatch = withoutExt.match(/(\d+(?:\.\d+)?)hz/i);
    if (hzMatch) {
      const hz = parseFloat(hzMatch[1]);
      if (!isNaN(hz) && BINAURAL_ASSETS[hz.toString()]) {
        return hz;
      }
      // If exact Hz not found, try closest fallback
      return hz; // Will use default in getBinauralAssetUri
    }
    
    // If no pattern matches, return filename anyway (will fallback to default)
    return withoutExt;
  }
  
  if (type === "background") {
    // Background filename is the asset name (e.g., "Babbling Brook.m4a" -> "Babbling Brook")
    // URL might be: .../background/Babbling%20Brook.m4a or .../background/looped/Babbling%20Brook.m4a
    // Decode URL encoding
    try {
      const decoded = decodeURIComponent(withoutExt);
      if (BACKGROUND_ASSETS[decoded]) {
        return decoded;
      }
      return decoded; // Will fallback to default in getBackgroundAssetUri
    } catch {
      return withoutExt; // If decode fails, use original
    }
  }
  
  if (type === "solfeggio") {
    // Solfeggio files: solfeggio_432_3min.m4a -> solfeggio_432_3min
    if (SOLFEGGIO_ASSETS[withoutExt]) {
      return withoutExt;
    }
    return withoutExt; // Will fallback to default in getSolfeggioAssetUri
  }
  
  return withoutExt;
}

/**
 * Resolve a playback bundle URL to a local bundled asset URI if available
 * Returns the original URL if not a bundled asset
 */
export async function resolveBundledAsset(
  url: string,
  type: "binaural" | "background" | "solfeggio"
): Promise<string> {
  // Skip resolution if URL is already a local file URI (already resolved)
  if (url.startsWith("file://")) {
    return url;
  }
  
  // Extract identifier from URL
  const identifier = extractAssetIdentifier(url, type);
  
  try {
    if (type === "binaural") {
      // Always try to use bundled asset for binaural (has good fallbacks)
      return await getBinauralAssetUri(identifier as string | number);
    } else if (type === "background") {
      // Always try to use bundled asset for background (has good fallbacks)
      return await getBackgroundAssetUri(identifier as string);
    } else if (type === "solfeggio") {
      // Always try to use bundled asset for solfeggio (has good fallbacks)
      return await getSolfeggioAssetUri(identifier as string);
    }
  } catch (error) {
    console.warn(`[BundledAssets] Failed to resolve bundled asset for ${url} (type: ${type}), using original URL:`, error);
  }
  
  // Fallback to original URL if resolution fails
  return url;
}

