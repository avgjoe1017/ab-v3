import path from "path";
import fs from "fs-extra";
import { STORAGE_PUBLIC_BASE_URL, ASSETS_PUBLIC_BASE_URL } from "../../index";

/**
 * V3 Compliance: Resolve binaural and background assets from AudioAsset table or constants.
 * Returns platform-aware URLs for playback bundle.
 */

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
    // For now, use assets from assets/audio/binaural/ folder
    // In production, these would be stored in AudioAsset table or CDN
    const assetPath = path.resolve(process.cwd(), "assets", "audio", "binaural", `alpha_${hz}hz_400_3min.m4a`);
    
    // Fallback to available binaural if exact match not found
    if (!(await fs.pathExists(assetPath))) {
        // Try to find any alpha binaural
        const fallbackPath = path.resolve(process.cwd(), "assets", "audio", "binaural", "alpha_10hz_400_3min.m4a");
        if (await fs.pathExists(fallbackPath)) {
            const url = `${ASSETS_PUBLIC_BASE_URL}/${path.relative(process.cwd(), fallbackPath).replace(/\\/g, "/")}`;
            return {
                urlByPlatform: { ios: url, android: url },
                loop: true,
                hz: 10,
            };
        }
        throw new Error(`Binaural asset not found for ${hz}Hz`);
    }

    const url = `${ASSETS_PUBLIC_BASE_URL}/${path.relative(process.cwd(), assetPath).replace(/\\/g, "/")}`;
    
    return {
        urlByPlatform: { ios: url, android: url },
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
    // For now, use assets from assets/audio/background/looped/ folder
    // In production, these would be stored in AudioAsset table or CDN
    const assetPath = path.resolve(process.cwd(), "assets", "audio", "background", "looped", `${backgroundId}.m4a`);
    
    // Fallback to default if not found
    if (!(await fs.pathExists(assetPath))) {
        const fallbackPath = path.resolve(process.cwd(), "assets", "audio", "background", "looped", `${DEFAULT_BACKGROUND_ID}.m4a`);
        if (await fs.pathExists(fallbackPath)) {
            const url = `${ASSETS_PUBLIC_BASE_URL}/${path.relative(process.cwd(), fallbackPath).replace(/\\/g, "/")}`;
            return {
                urlByPlatform: { ios: url, android: url },
                loop: true,
            };
        }
        throw new Error(`Background asset not found: ${backgroundId}`);
    }

    const url = `${ASSETS_PUBLIC_BASE_URL}/${path.relative(process.cwd(), assetPath).replace(/\\/g, "/")}`;
    
    return {
        urlByPlatform: { ios: url, android: url },
        loop: true,
    };
}

