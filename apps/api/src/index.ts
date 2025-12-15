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

import { prisma } from "./lib/db";

const app = new Hono();

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
  // Mock user ID (same as in POST /sessions)
  // In real auth, extract from token
  // For MVP, checking "default-user" usage or null
  const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000"; // Valid UUID for default user
  const ent = await getEntitlement(DEFAULT_USER_ID);
  return c.json(ent);
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
  // Use a valid UUID for the default user (required by schema)
  const DEFAULT_EMAIL = "default@example.com";
  const userId = "00000000-0000-0000-0000-000000000000"; // Hardcoded default user UUID for MVP
  
  // Ensure default user exists (for foreign key constraint)
  // Try to find by ID first, then by email if needed
  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    // Check if user exists with this email but different ID
    const existingByEmail = await prisma.user.findUnique({ where: { email: DEFAULT_EMAIL } });
    if (existingByEmail) {
      // If existing user has invalid UUID, use null (schema allows nullable)
      // Otherwise use the existing user's ID
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existingByEmail.id);
      user = isValidUUID ? existingByEmail : null;
    } else {
      // Create new user with the default UUID
      user = await prisma.user.create({ 
        data: { id: userId, email: DEFAULT_EMAIL } 
      });
    }
  }
  // Use null if user has invalid UUID (schema allows nullable)
  const finalUserId = user && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id) 
    ? user.id 
    : null;
  
  const entitlement = await getEntitlement(finalUserId);

  if (!entitlement.canCreateSession) {
    return c.json(error("FREE_LIMIT_REACHED", "You have reached your daily limit of free sessions."), 403);
  }

  // Duration check removed for V3 (Infinite sessions)

  // Create DB entry
  const session = await prisma.session.create({
    data: {
      source: "user",
      ownerUserId: finalUserId, // Ensure we track ownership for quota
      title: parsedBody.data.title,
      goalTag: parsedBody.data.goalTag,
      durationSec: undefined, // Infinite
      voiceId: parsedBody.data.voiceId,
      pace: "slow", // Locked
      affirmationSpacingMs: undefined, // Fixed internally
      affirmationsHash: crypto.createHash("sha256").update(parsedBody.data.affirmations.join("|")).digest("hex"),
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
    goalTag: session.goalTag,
    // durationSec: 0, // Removed or mapped to undefined if schema allows, but V3 Schema removed it so we omit
    affirmations: session.affirmations.map((a: { text: string }) => a.text),
    voiceId: session.voiceId,
    pace: "slow",
    // affirmationSpacingMs: 0, // Removed
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
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      audio: session.audio?.mergedAudioAsset ? {
        affirmationsMergedUrl: `${STORAGE_PUBLIC_BASE_URL}/${path.relative(process.cwd(), session.audio.mergedAudioAsset.url)}`,
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
    
    try {
      binaural = await getBinauralAsset(10, apiBaseUrl); // Default to 10Hz alpha
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
    
    // Construct affirmations URL (serve from storage)
    if (!session.audio.mergedAudioAsset?.url) {
      return c.json(error("ASSET_ERROR", "Merged audio asset URL not found"), 500);
    }
    
    // File path is relative to apps/api, e.g., "storage/merged/file.mp3"
    // Static server serves /storage/* from apps/api/, so we need to construct the URL correctly
    const filePath = session.audio.mergedAudioAsset.url;
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
    const affirmationsUrl = affirmationsUrlRelative.startsWith("http") 
      ? affirmationsUrlRelative 
      : `${protocol}://${host}${affirmationsUrlRelative}`;

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
  const port = Number(process.env.PORT ?? 8787);
  console.log(`[api] listening on http://localhost:${port}`);

  // Register job processors
  const { registerJobProcessor } = await import("./services/jobs");
  const { processEnsureAudioJob } = await import("./services/audio/generation");
  registerJobProcessor("ensure-audio", processEnsureAudioJob);

  // Start job worker loop (restart-safe, picks up pending jobs)
  const { startJobWorker } = await import("./services/jobs");
  await startJobWorker(2000); // Poll every 2 seconds

  // Custom handler for /storage/* with Range request support (required for iOS .m4a streaming)
  // Bun's serveStatic doesn't support Range requests, so we implement it manually
  app.use("/storage/*", async (c) => {
    const url = new URL(c.req.url);
    const requestPath = url.pathname.replace("/storage/", "");
    const filePath = path.resolve(process.cwd(), "storage", requestPath);
    
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
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        
        // Validate range
        if (start >= fileSize || end >= fileSize || start > end) {
          c.status(416); // Range Not Satisfiable
          c.header("Content-Range", `bytes */${fileSize}`);
          return c.body(null);
        }
        
        // Return 206 Partial Content with Range headers
        c.status(206);
        c.header("Content-Range", `bytes ${start}-${end}/${fileSize}`);
        c.header("Content-Length", chunkSize.toString());
        c.header("Accept-Ranges", "bytes");
        
        // Stream only the requested byte range without loading entire file into memory
        const stream = createReadStream(filePath, { start, end });
        return c.body(stream);
      } else {
        // No Range header - return full file
        c.header("Content-Length", fileSize.toString());
        c.header("Accept-Ranges", "bytes");
        return c.body(file);
      }
    } catch (error) {
      console.error("[API] Error serving storage file:", error);
      return c.json(error("INTERNAL_ERROR", "Failed to serve file", error), 500);
    }
  });
  
  // Custom handler for /assets/* with Range request support (required for iOS .m4a streaming)
  // Bun's serveStatic doesn't support Range requests, so we implement it manually
  const PROJECT_ROOT = path.resolve(process.cwd(), "..", ".."); // Go up from apps/api to project root
  app.use("/assets/*", async (c) => {
    const url = new URL(c.req.url);
    // Decode URL-encoded path segments (e.g., "Babbling%20Brook.m4a" -> "Babbling Brook.m4a")
    const requestPath = decodeURIComponent(url.pathname.replace("/assets/", ""));   
    // Assets are in apps/assets/, so go up one level from api to apps, then into assets
    const filePath = path.resolve(process.cwd(), "..", "assets", requestPath);
    
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
      
      // Support Range requests (required for iOS AVPlayer)
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        
        // Validate range
        if (start >= fileSize || end >= fileSize || start > end) {
          c.status(416); // Range Not Satisfiable
          c.header("Content-Range", `bytes */${fileSize}`);
          return c.body(null);
        }
        
        // Return 206 Partial Content with Range headers
        c.status(206);
        c.header("Content-Range", `bytes ${start}-${end}/${fileSize}`);
        c.header("Content-Length", chunkSize.toString());
        c.header("Accept-Ranges", "bytes");
        
        // Stream only the requested byte range without loading entire file into memory
        // Use fs.createReadStream with start/end options for efficient streaming
        const stream = createReadStream(filePath, { start, end });
        return c.body(stream);
      } else {
        // No Range header - return full file
        c.header("Content-Length", fileSize.toString());
        c.header("Accept-Ranges", "bytes");
        return c.body(file);
      }
    } catch (error) {
      console.error("[API] Error serving asset:", error);
      return c.text("Internal Server Error", 500);
    }
  });

  Bun.serve({ port, fetch: app.fetch });
}
