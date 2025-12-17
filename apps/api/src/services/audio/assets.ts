import path from "path";
import fs from "fs-extra";
import { STORAGE_PUBLIC_BASE_URL, ASSETS_PUBLIC_BASE_URL } from "../../index";
import { isS3Configured, getS3Config } from "../storage/s3";

/**
 * V3 Compliance: Resolve binaural and background assets from AudioAsset table or constants.
 * Returns platform-aware URLs for playback bundle.
 * 
 * iOS uses S3 URLs (HTTPS) to avoid App Transport Security issues.
 * Android can use local HTTP URLs.
 */

// Get project root: when running from apps/api, go up one level
// process.cwd() is apps/api when running the API server
const PROJECT_ROOT = path.resolve(process.cwd(), "..");

// Default binaural/background asset IDs (can be configured per session later)
const DEFAULT_BINAURAL_HZ = 10; // Alpha 10Hz
const DEFAULT_BACKGROUND_ID = "Babbling Brook"; // From assets/audio/background/looped/

// S3 URLs for static assets (uploaded via scripts/upload-static-assets-to-s3.ts)
function getS3AssetUrl(s3Key: string): string | null {
  const config = getS3Config();
  if (!config) return null;
  
  // URL-encode the key (handles spaces in filenames)
  const encodedKey = s3Key.split("/").map(segment => encodeURIComponent(segment)).join("/");
  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${encodedKey}`;
}

/**
 * Get binaural asset URL by frequency (Hz)
 * Returns platform-aware URLs for iOS and Android
 * 
 * iOS: Uses S3 HTTPS URL to avoid App Transport Security issues
 * Android: Uses local HTTP URL (no ATS restrictions)
 * 
 * @param hz - Binaural frequency in Hz (default: 10)
 * @param apiBaseUrl - Base URL of the API server (e.g., "http://localhost:8787")
 */
export async function getBinauralAsset(
    hz: number = DEFAULT_BINAURAL_HZ,
    apiBaseUrl: string = "http://localhost:8787"
): Promise<{
    urlByPlatform: { ios: string; android: string };
    loop: true;
    hz: number;
}> {
    // For iOS, prefer S3 URL (HTTPS) to avoid ATS issues
    const s3Key = `audio/binaural/alpha_${hz}hz_400_3min.m4a`;
    const s3Url = getS3AssetUrl(s3Key);
    
    // Fallback S3 URL for 10Hz if exact match might not exist
    const fallbackS3Key = "audio/binaural/alpha_10hz_400_3min.m4a";
    const fallbackS3Url = getS3AssetUrl(fallbackS3Key);
    
    // For Android, use local HTTP URL
    const assetPath = path.resolve(PROJECT_ROOT, "assets", "audio", "binaural", `alpha_${hz}hz_400_3min.m4a`);
    
    // Check if local file exists (for Android URL)
    let localUrl: string;
    if (await fs.pathExists(assetPath)) {
        const relativePath = path.relative(PROJECT_ROOT, assetPath).replace(/\\/g, "/");
        const basePath = relativePath.startsWith("assets/") 
          ? `/${relativePath}` 
          : `${ASSETS_PUBLIC_BASE_URL}/${relativePath}`;
        const encodedPath = basePath
          .split("/")
          .map(segment => segment ? encodeURIComponent(segment) : segment)
          .join("/");
        localUrl = `${apiBaseUrl}${encodedPath}`;
    } else {
        // Try fallback
        const fallbackPath = path.resolve(PROJECT_ROOT, "assets", "audio", "binaural", "alpha_10hz_400_3min.m4a");
        if (await fs.pathExists(fallbackPath)) {
            const relativePath = path.relative(PROJECT_ROOT, fallbackPath).replace(/\\/g, "/");
            const basePath = relativePath.startsWith("assets/") 
              ? `/${relativePath}` 
              : `${ASSETS_PUBLIC_BASE_URL}/${relativePath}`;
            const encodedPath = basePath
              .split("/")
              .map(segment => segment ? encodeURIComponent(segment) : segment)
              .join("/");
            localUrl = `${apiBaseUrl}${encodedPath}`;
        } else {
            throw new Error(`Binaural asset not found for ${hz}Hz. Looked in: ${assetPath}`);
        }
    }
    
    // iOS gets S3 URL (HTTPS), Android gets local URL (HTTP)
    const iosUrl = s3Url || fallbackS3Url || localUrl;
    const androidUrl = localUrl;
    
    return {
        urlByPlatform: { ios: iosUrl, android: androidUrl },
        loop: true,
        hz,
    };
}

/**
 * Get background asset URL by ID
 * Returns platform-aware URLs for iOS and Android
 * 
 * iOS: Uses S3 HTTPS URL to avoid App Transport Security issues
 * Android: Uses local HTTP URL (no ATS restrictions)
 * 
 * @param backgroundId - Background asset ID (default: "Babbling Brook")
 * @param apiBaseUrl - Base URL of the API server (e.g., "http://localhost:8787")
 */
export async function getBackgroundAsset(
    backgroundId: string = DEFAULT_BACKGROUND_ID,
    apiBaseUrl: string = "http://localhost:8787"
): Promise<{
    urlByPlatform: { ios: string; android: string };
    loop: true;
}> {
    // For iOS, prefer S3 URL (HTTPS) to avoid ATS issues
    // Note: S3 key doesn't include "looped/" subdirectory
    const s3Key = `audio/background/${backgroundId}.m4a`;
    const s3Url = getS3AssetUrl(s3Key);
    
    // Fallback S3 URL
    const fallbackS3Key = `audio/background/${DEFAULT_BACKGROUND_ID}.m4a`;
    const fallbackS3Url = getS3AssetUrl(fallbackS3Key);
    
    // For Android, use local HTTP URL
    // Local files are in assets/audio/background/looped/
    const assetPath = path.resolve(PROJECT_ROOT, "assets", "audio", "background", "looped", `${backgroundId}.m4a`);
    
    // Check if local file exists (for Android URL)
    let localUrl: string;
    if (await fs.pathExists(assetPath)) {
        const relativePath = path.relative(PROJECT_ROOT, assetPath).replace(/\\/g, "/");
        const basePath = relativePath.startsWith("assets/") 
          ? `/${relativePath}` 
          : `${ASSETS_PUBLIC_BASE_URL}/${relativePath}`;
        const encodedPath = basePath
          .split("/")
          .map(segment => segment ? encodeURIComponent(segment) : segment)
          .join("/");
        localUrl = `${apiBaseUrl}${encodedPath}`;
    } else {
        // Try fallback
        const fallbackPath = path.resolve(PROJECT_ROOT, "assets", "audio", "background", "looped", `${DEFAULT_BACKGROUND_ID}.m4a`);
        if (await fs.pathExists(fallbackPath)) {
            const relativePath = path.relative(PROJECT_ROOT, fallbackPath).replace(/\\/g, "/");
            const basePath = relativePath.startsWith("assets/") 
              ? `/${relativePath}` 
              : `${ASSETS_PUBLIC_BASE_URL}/${relativePath}`;
            const encodedPath = basePath
              .split("/")
              .map(segment => segment ? encodeURIComponent(segment) : segment)
              .join("/");
            localUrl = `${apiBaseUrl}${encodedPath}`;
        } else {
            throw new Error(`Background asset not found: ${backgroundId}. Looked in: ${assetPath}`);
        }
    }
    
    // iOS gets S3 URL (HTTPS), Android gets local URL (HTTP)
    const iosUrl = s3Url || fallbackS3Url || localUrl;
    const androidUrl = localUrl;
    
    return {
        urlByPlatform: { ios: iosUrl, android: androidUrl },
        loop: true,
    };
}

