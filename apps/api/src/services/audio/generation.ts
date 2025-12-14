import fs from "fs-extra";
import path from "path";
import crypto from "crypto";
import ffmpegStatic from "ffmpeg-static";
import { PrismaClient } from "@prisma/client";
import { AUDIO_PROFILE_V3 } from "@ab/contracts"; // Constants export might need adjustment if not direct
import { stitchAudioFiles } from "./stitching";
import { CHUNKS_DIR, SILENCE_DURATIONS_MS } from "./constants";
import { execFile } from "child_process";
import { promisify } from "util";
import { generateTTSAudio } from "./tts";
const execFileAsync = promisify(execFile);

// Temporary fix for simple imports if contracts export isn't fully set up with types in this context
// We'll rely on our local constants if needed, but try contracts first.

import { prisma } from "../../lib/db";

// Set path again here to be safe (or import from stitching if exported, but safer to set)


// Helper to calculate hash
function hashContent(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
}

async function ensureDirectory(dir: string) {
    await fs.ensureDir(dir);
}

/**
 * V3 Compliance: Pre-generate silence chunks during seed.
 * This function is only called during seed/migration, never during runtime.
 */
export async function generateSilenceFile(filePath: string, durationMs: number) {
    if (!ffmpegStatic) throw new Error("ffmpeg-static not found");
    const durationSec = durationMs / 1000;

    await execFileAsync(ffmpegStatic, [
        "-f", "lavfi",
        "-i", "anullsrc=r=44100:cl=stereo",
        "-t", durationSec.toString(),
        "-c:a", "libmp3lame",
        "-b:a", "128k",
        "-y", // Overwrite
        filePath
    ]);
}

/**
 * Pre-generate all silence chunks as per V3 spec.
 * Call this during seed/migration, not during runtime.
 */
export async function pregenerateSilenceChunks(): Promise<void> {
    console.log("🔇 Pre-generating silence chunks (V3 compliance)...");
    await ensureDirectory(CHUNKS_DIR);

    for (const durationMs of SILENCE_DURATIONS_MS) {
        const hash = `silence_${durationMs}`;
        const filename = `${hash}.mp3`;
        const filePath = path.join(CHUNKS_DIR, filename);

        // Check if already exists
        const existing = await prisma.audioAsset.findUnique({
            where: { kind_hash: { kind: "silence", hash } },
        });

        if (existing && await fs.pathExists(existing.url)) {
            console.log(`  ✓ Silence ${durationMs}ms already exists`);
            continue;
        }

        // Generate if missing
        if (!(await fs.pathExists(filePath))) {
            console.log(`  Generating silence ${durationMs}ms...`);
            await generateSilenceFile(filePath, durationMs);
        }

        // Save to DB
        await prisma.audioAsset.upsert({
            where: { kind_hash: { kind: "silence", hash } },
            update: { url: filePath },
            create: {
                kind: "silence",
                hash,
                url: filePath,
            },
        });

        console.log(`  ✓ Silence ${durationMs}ms ready`);
    }

    console.log("✅ All silence chunks pre-generated");
}

export async function ensureAffirmationChunk(
    text: string,
    voiceId: string,
    pace: string,
    variant: number = 1
): Promise<string> {
    // 1. Calc Hash (variant included)
    const hash = hashContent(`${voiceId}:${pace}:${text}:${variant}:${AUDIO_PROFILE_V3.VERSION}`);
    const filename = `${hash}.mp3`;
    const filePath = path.join(CHUNKS_DIR, filename);

    // 2. Check DB / File
    const existing = await prisma.audioAsset.findUnique({
        where: { kind_hash: { kind: "affirmationChunk", hash } },
    });

    if (existing && (await fs.pathExists(existing.url))) {
        return existing.url;
    }

    // 3. Generate using TTS service (falls back to beep if TTS not configured)
    await ensureDirectory(CHUNKS_DIR);

    if (!(await fs.pathExists(filePath))) {
        const provider = process.env.TTS_PROVIDER?.toLowerCase() || "beep";
        console.log(`[TTS] Generating affirmation chunk (v${variant}) using provider: ${provider}`);
        console.log(`[TTS] Text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
        try {
            await generateTTSAudio(
                { text, voiceId, pace, variant },
                filePath
            );
            console.log(`[TTS] ✅ Audio generated successfully: ${filename}`);
        } catch (error) {
            console.error(`[TTS] ❌ Failed to generate audio for ${filename}:`, error);
            throw error; // Re-throw to let caller handle
        }
    } else {
        console.log(`[TTS] Using cached audio: ${filename}`);
    }

    // 4. Save to DB
    await prisma.audioAsset.upsert({
        where: { kind_hash: { kind: "affirmationChunk", hash } },
        update: { url: filePath },
        create: {
            kind: "affirmationChunk",
            hash,
            url: filePath,
        },
    });

    return filePath;
}

/**
 * V3 Compliance: Silence must be pre-generated, never generated dynamically.
 * This function only retrieves pre-generated silence chunks and composes them if needed.
 */
export async function ensureSilence(durationMs: number): Promise<string> {
    // Quantize to nearest pre-generated duration
    const quantizedDuration = Math.max(100, Math.round(durationMs / 100) * 100);
    
    // Check if we have an exact match in pre-generated chunks
    const exactHash = `silence_${quantizedDuration}`;
    const exactAsset = await prisma.audioAsset.findUnique({
        where: { kind_hash: { kind: "silence", hash: exactHash } },
    });

    if (exactAsset && await fs.pathExists(exactAsset.url)) {
        return exactAsset.url;
    }

    // If no exact match, find the largest pre-generated chunk that fits
    // and compose multiple chunks if needed
    const availableDurations = SILENCE_DURATIONS_MS.filter(d => d <= quantizedDuration).sort((a, b) => b - a);
    
    if (availableDurations.length === 0) {
        throw new Error(`No pre-generated silence chunks available for ${quantizedDuration}ms. Run seed to generate chunks.`);
    }

    // Use the largest available chunk that fits
    const useDuration = availableDurations[0]!; // Safe: we checked length above
    const useHash = `silence_${useDuration}`;
    const useAsset = await prisma.audioAsset.findUnique({
        where: { kind_hash: { kind: "silence", hash: useHash } },
    });

    if (!useAsset || !(await fs.pathExists(useAsset.url))) {
        throw new Error(`Pre-generated silence chunk ${useHash} not found. Run seed to generate chunks.`);
    }

    // If we need more than one chunk, compose them
    if (quantizedDuration > useDuration) {
        const chunksNeeded = Math.ceil(quantizedDuration / useDuration);
        const filePaths: string[] = [];
        
        for (let i = 0; i < chunksNeeded; i++) {
            filePaths.push(useAsset.url);
        }

        // Stitch multiple chunks together
        const composedHash = `silence_composed_${quantizedDuration}_from_${useDuration}x${chunksNeeded}`;
        const composedPath = path.join(CHUNKS_DIR, `${composedHash}.mp3`);
        
        // Check if composed version already exists
        const existingComposed = await prisma.audioAsset.findUnique({
            where: { kind_hash: { kind: "silence", hash: composedHash } },
        });

        if (existingComposed && await fs.pathExists(existingComposed.url)) {
            return existingComposed.url;
        }

        // Stitch the chunks
        await ensureDirectory(CHUNKS_DIR);
        const stitchedPath = await stitchAudioFiles(filePaths, composedHash);
        
        // Save composed chunk
        await prisma.audioAsset.upsert({
            where: { kind_hash: { kind: "silence", hash: composedHash } },
            update: { url: stitchedPath },
            create: {
                kind: "silence",
                hash: composedHash,
                url: stitchedPath,
            },
        });

        return stitchedPath;
    }

    return useAsset.url;
}

const FIXED_SILENCE_MS = 3000; // Product Rule: Fixed silence

export async function processEnsureAudioJob(payload: { sessionId: string }) {
    const { sessionId } = payload;
    console.log(`Processing audio for session ${sessionId}`);

    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { affirmations: { orderBy: { idx: "asc" } } },
    });

    if (!session) throw new Error("Session not found");

    // 1. Gather all chunks
    const filePaths: string[] = [];
    // Force pace to "slow" regardless of DB (Migration safety)
    const effectivePace = "slow";

    for (const aff of session.affirmations) {
        // Read 1 (Neutral)
        const path1 = await ensureAffirmationChunk(aff.text, session.voiceId, effectivePace, 1);
        filePaths.push(path1);

        // Read 2 (Variation)
        const path2 = await ensureAffirmationChunk(aff.text, session.voiceId, effectivePace, 2);
        filePaths.push(path2);

        // Silence (Fixed)
        const silencePath = await ensureSilence(FIXED_SILENCE_MS);
        filePaths.push(silencePath);
    }

    // 2. Stitch
    // Calculate merged hash
    const mergedHash = hashContent(filePaths.join("|") + AUDIO_PROFILE_V3.VERSION);

    // Check if merged already exists
    const existingMerged = await prisma.audioAsset.findUnique({
        where: { kind_hash: { kind: "affirmationMerged", hash: mergedHash } }
    });

    let mergedPath = "";
    let mergedAssetId = "";

    if (existingMerged && await fs.pathExists(existingMerged.url)) {
        mergedPath = existingMerged.url;
        mergedAssetId = existingMerged.id;
    } else {
        // Stitched output
        console.log(`Stitching ${filePaths.length} chunks...`);
        mergedPath = await stitchAudioFiles(filePaths, mergedHash);

        const asset = await prisma.audioAsset.upsert({
            where: { kind_hash: { kind: "affirmationMerged", hash: mergedHash } },
            update: { url: mergedPath },
            create: {
                kind: "affirmationMerged",
                hash: mergedHash,
                url: mergedPath,
            }
        });
        mergedAssetId = asset.id;
    }

    // 3. Link to Session
    await prisma.sessionAudio.upsert({
        where: { sessionId },
        create: {
            sessionId,
            mergedAudioAssetId: mergedAssetId,
        },
        update: {
            mergedAudioAssetId: mergedAssetId,
            generatedAt: new Date(),
        }
    });

    return { mergedUrl: mergedPath, mergedAssetId };
}
