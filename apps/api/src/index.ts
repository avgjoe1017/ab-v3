import { Hono } from "hono";
import { z } from "zod";
import crypto from "crypto";
import { UUID, PlaybackBundleVMSchema, type ApiError, DraftSessionSchema, SessionV3Schema } from "@ab/contracts";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { createJob, triggerJobProcessing, getJob } from "./services/jobs";
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
  const ent = await getEntitlement("default-user-id");
  return c.json(ent);
});

// ---- SESSIONS ----

app.get("/sessions", async (c) => {
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, durationSec: true }, // Lightweight list
  });
  return c.json({ sessions });
});

app.post("/sessions", async (c) => {
  const body = await c.req.json();
  const parsedBody = DraftSessionSchema.safeParse(body);

  if (!parsedBody.success) {
    return c.json(error("VALIDATION_ERROR", "Invalid session draft provided", parsedBody.error.flatten()), 400);
  }

  // Risk 3: Entitlements Must Be Enforced Server-Side Early
  const userId = "default-user-id"; // Hardcoded for MVP
  const entitlement = await getEntitlement(userId);

  if (!entitlement.canCreateSession) {
    return c.json(error("FREE_LIMIT_REACHED", "You have reached your daily limit of free sessions."), 403);
  }

  // Duration check removed for V3 (Infinite sessions)

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
  const job = await createJob("ensure-audio", { sessionId: session.id });
  triggerJobProcessing(job.id, processEnsureAudioJob);

  // Return the new session (mapped to SessionV3)
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
});

app.get("/sessions/:id", async (c) => {
  const parsed = uuidParam.safeParse({ id: c.req.param("id") });
  if (!parsed.success) return c.json(error("INVALID_SESSION_ID", "Session id must be a UUID", parsed.error.flatten()), 400);

  const session = await prisma.session.findUnique({
    where: { id: parsed.data.id },
    include: { affirmations: { orderBy: { idx: "asc" } }, audio: { include: { mergedAudioAsset: true } } },
  });

  if (!session) return c.json(error("NOT_FOUND", "Session not found"), 404);

  // Map to V3
  const sessionV3 = {
    schemaVersion: 3,
    id: session.id,
    ownerUserId: session.ownerUserId,
    source: session.source,
    title: session.title,
    goalTag: session.goalTag,
    durationSec: session.durationSec,
    affirmations: session.affirmations.map(a => a.text),
    voiceId: session.voiceId,
    pace: session.pace,
    affirmationSpacingMs: session.affirmationSpacingMs,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    audio: session.audio?.mergedAudioAsset ? {
      affirmationsMergedUrl: `${STORAGE_PUBLIC_BASE_URL}/${path.relative(process.cwd(), session.audio.mergedAudioAsset.url)}`,
      affirmationsHash: session.audio.mergedAudioAsset.hash,
      generatedAt: session.audio.generatedAt.toISOString(),
    } : undefined
  };

  return c.json(sessionV3);
});

// ---- ensure-audio (Job Trigger) ----
app.post("/sessions/:id/ensure-audio", async (c) => {
  const parsed = uuidParam.safeParse({ id: c.req.param("id") });
  if (!parsed.success) return c.json(error("INVALID_SESSION_ID", "Invalid UUID"), 400);

  // Check if audio already exists?
  const existing = await prisma.sessionAudio.findUnique({ where: { sessionId: parsed.data.id } });
  if (existing) return c.json({ status: "ready" });

  // Create Job
  const { createJob, triggerJobProcessing } = await import("./services/jobs");
  const { processEnsureAudioJob } = await import("./services/audio/generation");

  const job = await createJob("ensure-audio", { sessionId: parsed.data.id });

  // Trigger async (in real world, strict async. here we trigger)
  triggerJobProcessing(job.id, processEnsureAudioJob);

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
  const { getBinauralAsset, getBackgroundAsset } = await import("./services/audio/assets");
  
  // Get real asset URLs (platform-aware)
  const binaural = await getBinauralAsset(10); // Default to 10Hz alpha
  const background = await getBackgroundAsset(); // Default background
  
  // Construct affirmations URL (serve from storage)
  const affirmationsRelativePath = path.relative(process.cwd(), session.audio.mergedAudioAsset.url).replace(/\\/g, "/");
  const affirmationsUrl = `${STORAGE_PUBLIC_BASE_URL}/${affirmationsRelativePath}`;

  const bundle = PlaybackBundleVMSchema.parse({
    sessionId: session.id,
    affirmationsMergedUrl: affirmationsUrl,
    background,
    binaural,
    mix: { affirmations: 1, binaural: 0.35, background: 0.35 },
    effectiveAffirmationSpacingMs: session.affirmationSpacingMs ?? 3000, // Default to 3s if null
  });

  return c.json({ bundle });
});

export default app;

// Bun entrypoint with static file serving (simple)
if (import.meta.main) {
  const port = Number(process.env.PORT ?? 8787);
  console.log(`[api] listening on http://localhost:${port}`);

  // Serve storage directory strictly for dev
  // In production, upload to S3.
  const { serveStatic } = await import("hono/bun");
  app.use("/storage/*", serveStatic({ root: "./" })); // serves ./storage/...
  app.use("/assets/*", serveStatic({ root: "./" })); // serves ./assets/... for audio files

  Bun.serve({ port, fetch: app.fetch });
}
