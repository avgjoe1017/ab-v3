import { Hono } from "hono";
import { z } from "zod";
import crypto from "crypto";
import { UUID, PlaybackBundleVMSchema, type ApiError, DraftSessionSchema, SessionV3Schema } from "@ab/contracts";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";
import { createReadStream } from "fs";
import { createJob, getJob, registerJobProcessor, startJobWorker } from "./services/jobs";
import { processEnsureAudioJob } from "./services/audio/generation";
import { getEntitlement } from "./services/entitlements";
import { generateAffirmations, type AffirmationGenerationRequest } from "./services/affirmation-generator";
import { getFrequencyForGoalTag } from "./services/session-frequency";

import { prisma } from "./lib/db";
import { getUserId } from "./lib/auth";
import { requireAuthMiddleware } from "./middleware/auth";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler } from "./middleware/error-handler";
import { config, getPort } from "./lib/config";

const app = new Hono();

// Phase 6: Production middleware
app.use("*", corsMiddleware);
app.onError(errorHandler);

// ---- helpers ----
const error = (code: ApiError["code"], message: string, details?: unknown) =>
  ({ code, message, details } satisfies ApiError);

const uuidParam = z.object({ id: UUID });

// Define STORAGE_PUBLIC_BASE_URL for local dev static serving
export const STORAGE_PUBLIC_BASE_URL = "/storage";
export const ASSETS_PUBLIC_BASE_URL = "/assets";

// ---- health ----
app.get("/health", (c) => c.json({ ok: true }));

// ---- ENTITLEMENTS ----
app.get("/me/entitlement", async (c) => {
  // Phase 6.1: Use auth helper (currently returns default user ID, ready for Clerk integration)
  const userId = await getUserId(c);
  const ent = await getEntitlement(userId);
  return c.json(ent);
});

// ---- AFFIRMATIONS ----
app.post("/affirmations/generate", async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate request
    const request: AffirmationGenerationRequest = {
      values: body.values || [],
      sessionType: body.sessionType || "Meditate",
      struggle: body.struggle,
      goal: body.goal, // User's written goal for this specific session
      count: body.count || 4,
    };

    // Generate affirmations
    const result = await generateAffirmations(request);
    
    return c.json({
      affirmations: result.affirmations,
      reasoning: result.reasoning,
    });
  } catch (err: unknown) {
    console.error("[API] Error generating affirmations:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return c.json(
      error("INTERNAL_ERROR", "Failed to generate affirmations", errorMessage),
      500
    );
  }
});

// ---- USER VALUES ----
app.post("/me/values", async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate request
    if (!Array.isArray(body.values)) {
      return c.json(error("VALIDATION_ERROR", "values must be an array"), 400);
    }

    // Phase 6.1: Use auth helper (currently returns default user ID, ready for Clerk integration)
    const userId = await getUserId(c);
    if (!userId) {
      return c.json(error("UNAUTHORIZED", "Authentication required"), 401);
    }
    
    // Ensure user exists (use upsert to handle case where user exists with different email)
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {}, // Don't update if exists
      create: {
        id: userId,
        email: `user-${userId}@example.com`, // Email will come from auth provider in production
      },
    });

    // Delete existing values for this user
    await prisma.userValue.deleteMany({
      where: { userId },
    });

    // Create new values with ranking
    const valuesToCreate = body.values.map((value: { valueId: string; valueText: string; rank?: number }, index: number) => ({
      userId,
      valueId: value.valueId,
      valueText: value.valueText,
      rank: value.rank ?? (index < 3 ? index + 1 : null), // Top 3 get ranks 1-3, rest are null
    }));

    await prisma.userValue.createMany({
      data: valuesToCreate,
    });

    return c.json({ success: true, count: valuesToCreate.length });
  } catch (err: unknown) {
    console.error("[API] Error saving user values:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return c.json(
      error("INTERNAL_ERROR", "Failed to save user values", errorMessage),
      500
    );
  }
});

app.get("/me/values", async (c) => {
  try {
    // Phase 6.1: Use auth helper
    const userId = await getUserId(c);
    if (!userId) {
      return c.json(error("UNAUTHORIZED", "Authentication required"), 401);
    }
    
    const values = await prisma.userValue.findMany({
      where: { userId },
      orderBy: [
        { rank: "asc" }, // Ranked values first
        { createdAt: "asc" }, // Then by creation order
      ],
    });

    return c.json({ values });
  } catch (err: unknown) {
    console.error("[API] Error fetching user values:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return c.json(
      error("INTERNAL_ERROR", "Failed to fetch user values", errorMessage),
      500
    );
  }
});

app.put("/me/struggle", async (c) => {
  try {
    const body = await c.req.json();
    const struggle = typeof body.struggle === "string" ? body.struggle.trim() : null;

    // Validate length
    if (struggle && struggle.length > 200) {
      return c.json(error("VALIDATION_ERROR", "Struggle text must be 200 characters or less"), 400);
    }

    // Phase 6.1: Use auth helper
    const userId = await getUserId(c);
    if (!userId) {
      return c.json(error("UNAUTHORIZED", "Authentication required"), 401);
    }
    
    // Ensure user exists and update struggle
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: { struggle: struggle || null },
      create: {
        id: userId,
        email: `user-${userId}@example.com`, // Email will come from auth provider in production
        struggle: struggle || undefined,
      },
    });

    return c.json({ success: true, struggle: user.struggle });
  } catch (err: unknown) {
    console.error("[API] Error saving user struggle:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return c.json(
      error("INTERNAL_ERROR", "Failed to save user struggle", errorMessage),
      500
    );
  }
});

app.get("/me/struggle", async (c) => {
  try {
    // Phase 6.1: Use auth helper
    const userId = await getUserId(c);
    if (!userId) {
      return c.json(error("UNAUTHORIZED", "Authentication required"), 401);
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { struggle: true },
    });

    return c.json({ struggle: user?.struggle || null });
  } catch (err: unknown) {
    console.error("[API] Error fetching user struggle:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return c.json(
      error("INTERNAL_ERROR", "Failed to fetch user struggle", errorMessage),
      500
    );
  }
});

// ---- SESSIONS ----

app.get("/sessions", async (c) => {
  // V3: Return lightweight list without durationSec (sessions are infinite)
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, goalTag: true }, // Lightweight list
  });
  console.log("[API] GET /sessions - Returning", sessions.length, "sessions");
  console.log("[API] Session goalTags:", sessions.map(s => ({ title: s.title, goalTag: s.goalTag })));
  return c.json({ sessions });
});

app.post("/sessions", async (c) => {
  const body = await c.req.json();
  const parsedBody = DraftSessionSchema.safeParse(body);

  if (!parsedBody.success) {
    return c.json(error("VALIDATION_ERROR", "Invalid session draft provided", parsedBody.error.flatten()), 400);
  }

  // Risk 3: Entitlements Must Be Enforced Server-Side Early
  // Phase 6.1: Use auth helper (currently returns default user ID, ready for Clerk integration)
  const userId = await getUserId(c);
  if (!userId) {
    return c.json(error("UNAUTHORIZED", "Authentication required"), 401);
  }
  
  // Ensure user exists (for foreign key constraint)
  // In production with Clerk, user will already exist from auth flow
  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    // Create user if doesn't exist (in production, Clerk webhook should create user)
    user = await prisma.user.create({ 
      data: { 
        id: userId, 
        email: `user-${userId}@example.com` // Email will come from auth provider in production
      } 
    });
  }
  
  const entitlement = await getEntitlement(userId);

  if (!entitlement.canCreateSession) {
    return c.json(error("FREE_LIMIT_REACHED", "You have reached your daily limit of free sessions."), 403);
  }

  // Duration check removed for V3 (Infinite sessions)

  // Phase 4.1: Get frequency info for this session type
  const frequencyInfo = getFrequencyForGoalTag(parsedBody.data.goalTag);

  // Create DB entry
  const session = await prisma.session.create({
    data: {
      source: "user",
      ownerUserId: userId, // Ensure we track ownership for quota
      title: parsedBody.data.title,
      goalTag: parsedBody.data.goalTag,
      durationSec: undefined, // Infinite
      voiceId: parsedBody.data.voiceId,
      pace: "slow", // Locked
      affirmationSpacingMs: undefined, // Fixed internally
      affirmationsHash: crypto.createHash("sha256").update(parsedBody.data.affirmations.join("|")).digest("hex"),
      frequencyHz: frequencyInfo.frequencyHz,
      brainwaveState: frequencyInfo.brainwaveState,
      // Create session affirmations
      affirmations: {
        create: parsedBody.data.affirmations.map((text: string, idx: number) => ({
          text,
          idx,
        })),
      },
    },
    include: { affirmations: true },
  });

  // Automatically trigger audio generation for "Auto-Generate" UX
  // This is an async operation, the client will poll /jobs/:id
  // Worker loop will pick up the job automatically
  try {
    await createJob("ensure-audio", { sessionId: session.id });
  } catch (jobError) {
    // Log but don't fail the session creation if job creation fails
    console.error("[API] Failed to create audio generation job:", jobError);
    // Continue - audio can be generated later via /ensure-audio endpoint
  }

  // Return the new session (mapped to SessionV3)
  try {
    const sessionV3 = SessionV3Schema.parse({
    schemaVersion: 3,
    id: session.id,
    ownerUserId: session.ownerUserId,
    source: session.source,
    title: session.title,
    goalTag: session.goalTag ?? undefined, // Convert null to undefined for schema
    // durationSec: 0, // Removed or mapped to undefined if schema allows, but V3 Schema removed it so we omit
    affirmations: session.affirmations.map((a: { text: string }) => a.text),
    voiceId: session.voiceId,
    pace: "slow",
    // affirmationSpacingMs: 0, // Removed
    frequencyHz: session.frequencyHz ?? undefined,
    brainwaveState: session.brainwaveState ?? undefined,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    audio: undefined // Not fully ready yet usually
    });
    
    return c.json(sessionV3, 201); // 201 Created
  } catch (parseError) {
    console.error("[API] Failed to parse SessionV3:", parseError);
    return c.json(error("INTERNAL_ERROR", "Failed to serialize session response", parseError), 500);
  }
});

app.get("/sessions/:id", async (c) => {
  const parsed = uuidParam.safeParse({ id: c.req.param("id") });
  if (!parsed.success) return c.json(error("INVALID_SESSION_ID", "Session id must be a UUID", parsed.error.flatten()), 400);

  const session = await prisma.session.findUnique({
    where: { id: parsed.data.id },
    include: { affirmations: { orderBy: { idx: "asc" } }, audio: { include: { mergedAudioAsset: true } } },
  });

  if (!session) return c.json(error("NOT_FOUND", "Session not found"), 404);

  // Construct affirmations URL if audio exists (same logic as playback-bundle endpoint)
  let affirmationsMergedUrl: string | undefined;
  if (session.audio?.mergedAudioAsset?.url) {
    const filePath = session.audio.mergedAudioAsset.url;
    
    // If URL is already an S3/CloudFront URL (starts with http/https), use it directly
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      affirmationsMergedUrl = filePath;
    } else {
      // Local file path - construct URL for local serving
      const protocol = c.req.header("x-forwarded-proto") || "http";
      const host = c.req.header("host") || "localhost:8787";
      
      let affirmationsUrlRelative: string;
      if (path.isAbsolute(filePath)) {
        const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
        affirmationsUrlRelative = relativePath.startsWith("storage/") 
          ? `/${relativePath}` 
          : `${STORAGE_PUBLIC_BASE_URL}/${relativePath}`;
      } else {
        affirmationsUrlRelative = filePath.startsWith("storage/") 
          ? `/${filePath}` 
          : `${STORAGE_PUBLIC_BASE_URL}/${filePath}`;
      }
      
      affirmationsMergedUrl = affirmationsUrlRelative.startsWith("http") 
        ? affirmationsUrlRelative 
        : `${protocol}://${host}${affirmationsUrlRelative}`;
    }
  }

  // Map to strict SessionV3 (V3 compliance: no durationSec, pace is always "slow", no affirmationSpacingMs)
  try {
    const sessionV3 = SessionV3Schema.parse({
      schemaVersion: 3,
      id: session.id,
      ownerUserId: session.ownerUserId,
      source: session.source as "catalog" | "user" | "generated",
      title: session.title,
      goalTag: session.goalTag ?? undefined,
      // durationSec removed in V3 (infinite sessions)
      affirmations: session.affirmations.map(a => a.text),
      voiceId: session.voiceId,
      pace: "slow", // V3: pace is always "slow"
      // affirmationSpacingMs removed in V3 (fixed internally)
      frequencyHz: session.frequencyHz ?? undefined, // Phase 4.1: Frequency transparency
      brainwaveState: session.brainwaveState ?? undefined, // Phase 4.1: Brainwave state
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      audio: session.audio?.mergedAudioAsset && affirmationsMergedUrl ? {
        affirmationsMergedUrl,
        affirmationsHash: session.audio.mergedAudioAsset.hash,
        generatedAt: session.audio.generatedAt.toISOString(),
      } : undefined
    });
    
    return c.json(sessionV3);
  } catch (parseError) {
    console.error("[API] Failed to parse SessionV3:", parseError);
    return c.json(error("INTERNAL_ERROR", "Failed to serialize session response", parseError), 500);
  }
});

// ---- ensure-audio (Job Trigger) ----
app.post("/sessions/:id/ensure-audio", async (c) => {
  const parsed = uuidParam.safeParse({ id: c.req.param("id") });
  if (!parsed.success) return c.json(error("INVALID_SESSION_ID", "Invalid UUID"), 400);

  // Check if audio already exists?
  const existing = await prisma.sessionAudio.findUnique({ where: { sessionId: parsed.data.id } });
  if (existing) return c.json({ status: "ready" });

  // Create Job - worker loop will pick it up automatically
  const { createJob } = await import("./services/jobs");

  const job = await createJob("ensure-audio", { sessionId: parsed.data.id });

  return c.json({ status: "pending", jobId: job.id });
});

// ---- jobs status ----
app.get("/jobs/:id", async (c) => {
  const { getJob } = await import("./services/jobs");
  const job = await getJob(c.req.param("id"));
  if (!job) return c.json(error("NOT_FOUND", "Job not found"), 404);
  return c.json({ job });
});

// ---- playback bundle ----
app.get("/sessions/:id/playback-bundle", async (c) => {
  try {
    const parsed = uuidParam.safeParse({ id: c.req.param("id") });
    if (!parsed.success) return c.json(error("INVALID_SESSION_ID", "Session id must be a UUID", parsed.error.flatten()), 400);

    const session = await prisma.session.findUnique({
      where: { id: parsed.data.id },
      include: { audio: { include: { mergedAudioAsset: true } } }
    });

    if (!session) return c.json(error("NOT_FOUND", "Session not found"), 404);

    if (!session.audio) {
      return c.json(error("AUDIO_NOT_READY", "Audio not generated", { sessionId: session.id }), 404);
      // Client should see this error and call ensure-audio
    }

    // V3 Compliance: Resolve real binaural/background assets
    // Use request host to construct URLs that work for physical devices
    const host = c.req.header("host") || "localhost:8787";
    const protocol = c.req.header("x-forwarded-proto") || "http";
    const apiBaseUrl = `${protocol}://${host}`;
    
    const { getBinauralAsset, getBackgroundAsset } = await import("./services/audio/assets");
    
    // Get real asset URLs (platform-aware) with error handling
    // Pass apiBaseUrl as argument instead of mutating process.env
    let binaural;
    let background;
    
    // Phase 4.1: Use session's frequencyHz if available, otherwise default to 10Hz
    const binauralHz = session.frequencyHz ?? 10;
    try {
      binaural = await getBinauralAsset(binauralHz, apiBaseUrl);
    } catch (binauralError: any) {
      console.error("[API] Failed to get binaural asset:", binauralError);
      return c.json(error("ASSET_ERROR", `Binaural asset not available: ${binauralError.message}`, binauralError), 500);
    }
    
    try {
      background = await getBackgroundAsset(undefined, apiBaseUrl); // Default background
    } catch (backgroundError: any) {
      console.error("[API] Failed to get background asset:", backgroundError);
      return c.json(error("ASSET_ERROR", `Background asset not available: ${backgroundError.message}`, backgroundError), 500);
    }
    
    // Construct affirmations URL
    if (!session.audio.mergedAudioAsset?.url) {
      return c.json(error("ASSET_ERROR", "Merged audio asset URL not found"), 500);
    }
    
    const filePath = session.audio.mergedAudioAsset.url;
    let affirmationsUrl: string;
    
    // If URL is already an S3/CloudFront URL (starts with http/https), use it directly
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      affirmationsUrl = filePath;
    } else {
      // Local file path - construct URL for local serving
      // File path is relative to apps/api, e.g., "storage/merged/file.mp3"
      // Static server serves /storage/* from apps/api/, so we need to construct the URL correctly
      let affirmationsUrlRelative: string;
      
      // If path is absolute, make it relative to process.cwd() (apps/api)
      if (path.isAbsolute(filePath)) {
        const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
        // If relative path already starts with "storage", use it directly
        affirmationsUrlRelative = relativePath.startsWith("storage/") 
          ? `/${relativePath}` 
          : `${STORAGE_PUBLIC_BASE_URL}/${relativePath}`;
      } else {
        // Path is already relative, ensure it starts with /storage/
        affirmationsUrlRelative = filePath.startsWith("storage/") 
          ? `/${filePath}` 
          : `${STORAGE_PUBLIC_BASE_URL}/${filePath}`;
      }
      
      // Convert to absolute URL using request host (works for localhost, IP addresses, etc.)
      affirmationsUrl = affirmationsUrlRelative.startsWith("http") 
        ? affirmationsUrlRelative 
        : `${protocol}://${host}${affirmationsUrlRelative}`;
    }

    // Parse loudness and voiceActivity from metaJson if available
    let loudness: { affirmationsLUFS?: number; backgroundLUFS?: number; binauralLUFS?: number } | undefined;
    let voiceActivity: { segments: Array<{ startMs: number; endMs: number }>; thresholdDb?: number; minSilenceMs?: number } | undefined;
    
    if (session.audio.mergedAudioAsset?.metaJson) {
      try {
        const meta = JSON.parse(session.audio.mergedAudioAsset.metaJson);
        if (meta.loudness) {
          loudness = {
            affirmationsLUFS: meta.loudness.input_i,
            // Background and binaural loudness will be measured separately
            // For now, we only measure affirmations during generation
          };
        }
        if (meta.voiceActivity && meta.voiceActivity.segments) {
          voiceActivity = {
            segments: meta.voiceActivity.segments.map((seg: any) => ({
              startMs: Math.round(seg.startMs),
              endMs: Math.round(seg.endMs),
            })),
            thresholdDb: meta.voiceActivity.thresholdDb,
            minSilenceMs: meta.voiceActivity.minSilenceMs,
          };
        }
      } catch (e) {
        console.warn("[API] Failed to parse metaJson:", e);
      }
    }

    try {
      const bundle = PlaybackBundleVMSchema.parse({
        sessionId: session.id,
        affirmationsMergedUrl: affirmationsUrl,
        background,
        binaural,
        mix: { affirmations: 1, binaural: 0.3, background: 0.3 }, // Default to 30% for binaural and background
        effectiveAffirmationSpacingMs: session.affirmationSpacingMs ?? 3000, // Default to 3s if null
        loudness, // Include loudness measurements if available
        voiceActivity, // Include voice activity segments for ducking
      });

      return c.json({ bundle });
    } catch (parseError: any) {
      console.error("[API] Failed to parse PlaybackBundleVM:", parseError);
      return c.json(error("VALIDATION_ERROR", "Failed to construct playback bundle", parseError), 500);
    }
  } catch (err: any) {
    console.error("[API] Unexpected error in playback-bundle:", err);
    return c.json(error("INTERNAL_ERROR", "Internal server error", err.message), 500);
  }
});

export default app;

// Bun entrypoint with static file serving (simple)
if (import.meta.main) {
  const port = getPort();
  console.log(`[api] listening on http://localhost:${port}`);
  console.log(`[api] Environment: ${config.env}`);
  console.log(`[api] Clerk configured: ${config.clerkConfigured}`);
  console.log(`[api] RevenueCat configured: ${config.revenueCatConfigured}`);
  console.log(`[api] S3 configured: ${config.s3Configured}`);

  // Register job processors
  const { registerJobProcessor } = await import("./services/jobs");
  const { processEnsureAudioJob } = await import("./services/audio/generation");
  registerJobProcessor("ensure-audio", processEnsureAudioJob);

  // Start job worker loop (restart-safe, picks up pending jobs)
  const { startJobWorker } = await import("./services/jobs");
  await startJobWorker(2000); // Poll every 2 seconds

  // Custom handler for /storage/* with Range request support (required for iOS .m4a streaming)
  // Bun's serveStatic doesn't support Range requests, so we implement it manually
  // Also supports HEAD requests (required for iOS AVPlayer)
  const serveStorage = async (c: any) => {
    const url = new URL(c.req.url);
    const requestPath = url.pathname.replace("/storage/", "");
    const filePath = path.resolve(process.cwd(), "storage", requestPath);
    const isHead = c.req.method === "HEAD";
    
    try {
      const file = Bun.file(filePath);
      const exists = await file.exists();
      
      if (!exists) {
        return c.json(error("NOT_FOUND", `File not found: ${requestPath}`), 404);
      }
      
      const stats = await file.stat();
      const fileSize = stats.size;
      const range = c.req.header("range");
      
      // Set proper Content-Type based on file extension
      if (filePath.endsWith(".m4a")) {
        c.header("Content-Type", "audio/mp4");
      } else if (filePath.endsWith(".mp3")) {
        c.header("Content-Type", "audio/mpeg");
      }
      
      // Support Range requests (required for iOS AVPlayer)
      // RFC 7233 formats: bytes=start-end, bytes=start-, bytes=-suffix
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const startStr = parts[0];
        const endStr = parts[1];
        
        let start: number;
        let end: number;
        
        if (!startStr && endStr) {
          // Suffix format: bytes=-suffix (e.g., bytes=-500 for last 500 bytes)
          const suffixLength = parseInt(endStr, 10);
          if (isNaN(suffixLength) || suffixLength <= 0) {
            c.status(400);
            return c.json(error("VALIDATION_ERROR", "Invalid Range header suffix"));
          }
          start = Math.max(0, fileSize - suffixLength);
          end = fileSize - 1;
        } else if (startStr && !endStr) {
          // Prefix format: bytes=start- (from start to end of file)
          start = parseInt(startStr, 10);
          if (isNaN(start) || start < 0) {
            c.status(400);
            return c.json(error("VALIDATION_ERROR", "Invalid Range header start"));
          }
          end = fileSize - 1;
        } else if (startStr && endStr) {
          // Full range: bytes=start-end
          start = parseInt(startStr, 10);
          end = parseInt(endStr, 10);
          if (isNaN(start) || isNaN(end) || start < 0 || end < 0) {
            c.status(400);
            return c.json(error("VALIDATION_ERROR", "Invalid Range header"));
          }
        } else {
          // Both empty - invalid
          c.status(400);
          return c.json(error("VALIDATION_ERROR", "Invalid Range header"));
        }
        
        const chunkSize = end - start + 1;
        
        // Validate range
        if (start >= fileSize || end >= fileSize || start > end) {
          c.status(416); // Range Not Satisfiable
          c.header("Content-Range", `bytes */${fileSize}`);
          return c.body(null);
        }
        
        // Return 206 Partial Content with Range headers
        c.header("Content-Range", `bytes ${start}-${end}/${fileSize}`);
        c.header("Content-Length", chunkSize.toString());
        c.header("Accept-Ranges", "bytes");
        
        // For HEAD requests, return headers without body
        if (isHead) {
          return c.body(null, 206);
        }
        
        // Stream only the requested byte range without loading entire file into memory
        // Use Bun.file().slice() for efficient range requests
        const slicedFile = file.slice(start, end + 1);
        // Create Response with proper headers and status code
        const response = new Response(slicedFile, { status: 206 });
        // Copy headers from context
        c.res.headers.forEach((value: string, key: string) => {
          response.headers.set(key, value);
        });
        return response;
      } else {
        // No Range header - return full file
        c.header("Content-Length", fileSize.toString());
        c.header("Accept-Ranges", "bytes");
        
        // For HEAD requests, return headers without body
        if (isHead) {
          return c.body(null, 200);
        }
        
        // Create Response with proper headers
        const response = new Response(file);
        // Copy headers from context
        c.res.headers.forEach((value: string, key: string) => {
          response.headers.set(key, value);
        });
        return response;
      }
    } catch (err: unknown) {
      console.error("[API] Error serving storage file:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      return c.json(error("INTERNAL_ERROR", "Failed to serve file", errorMessage), 500);
    }
  };
  
  app.on(["GET", "HEAD"], "/storage/*", serveStorage);
  
  // Custom handler for /assets/* with Range request support (required for iOS .m4a streaming)
  // Bun's serveStatic doesn't support Range requests, so we implement it manually
  // Also supports HEAD requests (required for iOS AVPlayer)
  const serveAssets = async (c: any) => {
    const url = new URL(c.req.url);
    // Decode URL-encoded path segments (e.g., "Babbling%20Brook.m4a" -> "Babbling Brook.m4a")
    const requestPath = decodeURIComponent(url.pathname.replace("/assets/", ""));   
    // Assets are in apps/assets/, so go up one level from api to apps, then into assets
    const filePath = path.resolve(process.cwd(), "..", "assets", requestPath);
    const isHead = c.req.method === "HEAD";
    
    try {
      const file = Bun.file(filePath);
      const exists = await file.exists();
      
      if (!exists) {
        return c.notFound();
      }
      
      const stats = await file.stat();
      const fileSize = stats.size;
      const range = c.req.header("range");
      
      // Set proper Content-Type based on file extension
      if (filePath.endsWith(".m4a")) {
        c.header("Content-Type", "audio/mp4");
      } else if (filePath.endsWith(".mp3")) {
        c.header("Content-Type", "audio/mpeg");
      }
      
      // Set CORS headers for audio assets (required for mobile app)
      c.header("Access-Control-Allow-Origin", "*");
      c.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      c.header("Access-Control-Allow-Headers", "Range");
      c.header("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
      
      // Support Range requests (required for iOS AVPlayer)
      // RFC 7233 formats: bytes=start-end, bytes=start-, bytes=-suffix
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const startStr = parts[0];
        const endStr = parts[1];
        
        let start: number;
        let end: number;
        
        if (!startStr && endStr) {
          // Suffix format: bytes=-suffix (e.g., bytes=-500 for last 500 bytes)
          const suffixLength = parseInt(endStr, 10);
          if (isNaN(suffixLength) || suffixLength <= 0) {
            c.status(400);
            return c.json(error("VALIDATION_ERROR", "Invalid Range header suffix"));
          }
          start = Math.max(0, fileSize - suffixLength);
          end = fileSize - 1;
        } else if (startStr && !endStr) {
          // Prefix format: bytes=start- (from start to end of file)
          start = parseInt(startStr, 10);
          if (isNaN(start) || start < 0) {
            c.status(400);
            return c.json(error("VALIDATION_ERROR", "Invalid Range header start"));
          }
          end = fileSize - 1;
        } else if (startStr && endStr) {
          // Full range: bytes=start-end
          start = parseInt(startStr, 10);
          end = parseInt(endStr, 10);
          if (isNaN(start) || isNaN(end) || start < 0 || end < 0) {
            c.status(400);
            return c.json(error("VALIDATION_ERROR", "Invalid Range header"));
          }
        } else {
          // Both empty - invalid
          c.status(400);
          return c.json(error("VALIDATION_ERROR", "Invalid Range header"));
        }
        
        const chunkSize = end - start + 1;
        
        // Validate range
        if (start >= fileSize || end >= fileSize || start > end) {
          c.status(416); // Range Not Satisfiable
          c.header("Content-Range", `bytes */${fileSize}`);
          return c.body(null);
        }
        
        // Return 206 Partial Content with Range headers
        c.header("Content-Range", `bytes ${start}-${end}/${fileSize}`);
        c.header("Content-Length", chunkSize.toString());
        c.header("Accept-Ranges", "bytes");
        
        // For HEAD requests, return headers without body
        if (isHead) {
          return c.body(null, 206);
        }
        
        // Stream only the requested byte range without loading entire file into memory
        // Use Bun.file().slice() for efficient range requests
        const slicedFile = file.slice(start, end + 1);
        // Create Response with proper headers and status code
        const response = new Response(slicedFile, { status: 206 });
        // Copy headers from context
        c.res.headers.forEach((value: string, key: string) => {
          response.headers.set(key, value);
        });
        return response;
      } else {
        // No Range header - return full file
        c.header("Content-Length", fileSize.toString());
        c.header("Accept-Ranges", "bytes");
        
        // For HEAD requests, return headers without body
        if (isHead) {
          return c.body(null, 200);
        }
        
        // Create Response with proper headers
        const response = new Response(file);
        // Copy headers from context
        c.res.headers.forEach((value: string, key: string) => {
          response.headers.set(key, value);
        });
        return response;
      }
    } catch (err: unknown) {
      console.error("[API] Error serving asset:", err);
      const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
      return c.text(errorMessage, 500);
    }
  };
  
  app.on(["GET", "HEAD"], "/assets/*", serveAssets);

  Bun.serve({ port, fetch: app.fetch });
}
