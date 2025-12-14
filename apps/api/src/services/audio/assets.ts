import path from "path";
import fs from "fs-extra";
import { STORAGE_PUBLIC_BASE_URL, ASSETS_PUBLIC_BASE_URL } from "../../index";

// Get API base URL from environment or default to localhost
// This can be overridden via API_BASE_URL env var for physical device testing
const getApiBaseUrl = (): string => {
  const envUrl = process.env.API_BASE_URL;
  if (envUrl) return envUrl;
  return "http://localhost:8787";
};

/**
 * V3 Compliance: Resolve binaural and background assets from AudioAsset table or constants.
 * Returns platform-aware URLs for playback bundle.
 */

// Get project root: when running from apps/api, go up one level
// process.cwd() is apps/api when running the API server
const PROJECT_ROOT = path.resolve(process.cwd(), "..");

// Default binaural/background asset IDs (can be configured per session later)
const DEFAULT_BINAURAL_HZ = 10; // Alpha 10Hz
const DEFAULT_BACKGROUND_ID = "Babbling Brook"; // From assets/audio/background/looped/

/**
 * Get binaural asset URL by frequency (Hz)
 * Returns platform-aware URLs for iOS and Android
 */
export async function getBinauralAsset(hz: number = DEFAULT_BINAURAL_HZ): Promise<{
    urlByPlatform: { ios: string; android: string };
    loop: true;
    hz: number;
}> {
    // Assets are in project root: assets/audio/binaural/
    const assetPath = path.resolve(PROJECT_ROOT, "assets", "audio", "binaural", `alpha_${hz}hz_400_3min.m4a`);
    
    // Fallback to available binaural if exact match not found
    if (!(await fs.pathExists(assetPath))) {
        // Try to find any alpha binaural
        const fallbackPath = path.resolve(PROJECT_ROOT, "assets", "audio", "binaural", "alpha_10hz_400_3min.m4a");
        if (await fs.pathExists(fallbackPath)) {
            const url = `${ASSETS_PUBLIC_BASE_URL}/${path.relative(PROJECT_ROOT, fallbackPath).replace(/\\/g, "/")}`;
            return {
                urlByPlatform: { ios: url, android: url },
                loop: true,
                hz: 10,
            };
        }
        throw new Error(`Binaural asset not found for ${hz}Hz. Looked in: ${assetPath}`);
    }

    // Generate absolute URL - need to use full URL for Zod validation
    // ASSETS_PUBLIC_BASE_URL is "/assets", but we need full URL for mobile app
    const relativePath = path.relative(PROJECT_ROOT, assetPath).replace(/\\/g, "/");
    // relativePath will be like "assets/audio/binaural/alpha_10hz_400_3min.m4a"
    // We need "/assets/assets/audio/..." but static server serves from PROJECT_ROOT
    // So we just need "/assets/audio/..." - strip the "assets/" prefix if present
    const basePath = relativePath.startsWith("assets/") 
      ? `/${relativePath}` 
      : `${ASSETS_PUBLIC_BASE_URL}/${relativePath}`;
    
    // CRITICAL: URL-encode path segments (especially filenames with spaces)
    // Split path, encode each segment, then rejoin
    // This ensures "Babbling Brook.m4a" becomes "Babbling%20Brook.m4a"
    const encodedPath = basePath
      .split("/")
      .map(segment => segment ? encodeURIComponent(segment) : segment)
      .join("/");
    
    // Convert to absolute URL if it's a relative path
    // Use API_BASE_URL env var or default to localhost
    const absoluteUrl = encodedPath.startsWith("http") ? encodedPath : `${getApiBaseUrl()}${encodedPath}`;
    
    return {
        urlByPlatform: { ios: absoluteUrl, android: absoluteUrl },
        loop: true,
        hz,
    };
}

/**
 * Get background asset URL by ID
 * Returns platform-aware URLs for iOS and Android
 */
export async function getBackgroundAsset(backgroundId: string = DEFAULT_BACKGROUND_ID): Promise<{
    urlByPlatform: { ios: string; android: string };
    loop: true;
}> {
    // Assets are in project root: assets/audio/background/looped/
    const assetPath = path.resolve(PROJECT_ROOT, "assets", "audio", "background", "looped", `${backgroundId}.m4a`);
    
    // Fallback to default if not found
    if (!(await fs.pathExists(assetPath))) {
        const fallbackPath = path.resolve(PROJECT_ROOT, "assets", "audio", "background", "looped", `${DEFAULT_BACKGROUND_ID}.m4a`);
        if (await fs.pathExists(fallbackPath)) {
            const url = `${ASSETS_PUBLIC_BASE_URL}/${path.relative(PROJECT_ROOT, fallbackPath).replace(/\\/g, "/")}`;
            return {
                urlByPlatform: { ios: url, android: url },
                loop: true,
            };
        }
        throw new Error(`Background asset not found: ${backgroundId}. Looked in: ${assetPath}`);
    }

    // Generate absolute URL - need to use full URL for Zod validation
    const relativePath = path.relative(PROJECT_ROOT, assetPath).replace(/\\/g, "/");
    // relativePath will be like "assets/audio/background/looped/Babbling Brook.m4a"
    // We need "/assets/assets/audio/..." but static server serves from PROJECT_ROOT
    // So we just need "/assets/audio/..." - strip the "assets/" prefix if present
    const basePath = relativePath.startsWith("assets/") 
      ? `/${relativePath}` 
      : `${ASSETS_PUBLIC_BASE_URL}/${relativePath}`;
    
    // CRITICAL: URL-encode path segments (especially filenames with spaces)
    // Split path, encode each segment, then rejoin
    // This ensures "Babbling Brook.m4a" becomes "Babbling%20Brook.m4a"
    const encodedPath = basePath
      .split("/")
      .map(segment => segment ? encodeURIComponent(segment) : segment)
      .join("/");
    
    // Convert to absolute URL if it's a relative path
    // Use API_BASE_URL env var or default to localhost
    const absoluteUrl = encodedPath.startsWith("http") ? encodedPath : `${getApiBaseUrl()}${encodedPath}`;
    
    return {
        urlByPlatform: { ios: absoluteUrl, android: absoluteUrl },
        loop: true,
    };
}

