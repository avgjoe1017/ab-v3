import { z } from "zod";

export const UUID = z.string().uuid();

// ---- PreferencesV3 ----
export const MixSchema = z.object({
  affirmations: z.number().min(0).max(1),
  binaural: z.number().min(0).max(1),
  background: z.number().min(0).max(1),
});

export const PreferencesV3Schema = z.object({
  schemaVersion: z.literal(3),
  voiceId: z.string().min(1),
  pace: z.enum(["slow", "normal", "fast"]),
  affirmationSpacingMs: z.number().int().min(0),
  binauralHz: z.number().min(1),
  backgroundId: z.string().min(1),
  mix: MixSchema,
  loopBackground: z.boolean(),
  loopBinaural: z.boolean(),
});

export type PreferencesV3 = z.infer<typeof PreferencesV3Schema>;

// ---- DraftSession (client-only) ----
export const DraftSessionSchema = z.object({
  localDraftId: z.string().uuid(),
  title: z.string().min(1),
  goalTag: z.string().optional(),
  // durationSec removed/ignored in V3 Loop
  affirmations: z.array(z.string().min(1)).min(1),
  voiceId: z.string().min(1),
  pace: z.literal("slow").default("slow"), // Locked
  // affirmationSpacingMs: z.number().int().min(0), // Removed from user control
});

export type DraftSession = z.infer<typeof DraftSessionSchema>;

// ---- SessionV3 ----
export const SessionV3Schema = z.object({
  schemaVersion: z.literal(3),
  id: UUID,
  ownerUserId: z.string().uuid().nullable(),
  source: z.enum(["catalog", "user", "generated"]),
  title: z.string().min(1),
  goalTag: z.string().optional(),
  // durationSec: z.number().int().min(30), // Removed
  affirmations: z.array(z.string().min(1)).min(1),
  voiceId: z.string().min(1),
  pace: z.literal("slow"),
  // affirmationSpacingMs: z.number().int().min(0), // Removed
  frequencyHz: z.number().optional(), // Phase 4.1: Binaural frequency
  brainwaveState: z.enum(["Delta", "Theta", "Alpha", "SMR", "Beta"]).optional(), // Phase 4.1: Brainwave state
  audio: z.object({
    affirmationsMergedUrl: z.string().url(),
    affirmationsHash: z.string().min(1),
    generatedAt: z.string().datetime(),
  }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type SessionV3 = z.infer<typeof SessionV3Schema>;

// ---- PlaybackBundleVM ----
export const PlaybackBundleVMSchema = z.object({
  sessionId: UUID,
  affirmationsMergedUrl: z.string().url(),
  background: z.object({
    urlByPlatform: z.object({ ios: z.string().url(), android: z.string().url() }),
    loop: z.literal(true),
  }),
  binaural: z.object({
    urlByPlatform: z.object({ ios: z.string().url(), android: z.string().url() }),
    loop: z.literal(true),
    hz: z.number().min(1),
  }),
  mix: MixSchema,
  effectiveAffirmationSpacingMs: z.number().int().min(0),
  loudness: z.object({
    affirmationsLUFS: z.number().optional(),
    backgroundLUFS: z.number().optional(),
    binauralLUFS: z.number().optional(),
  }).optional(),
  voiceActivity: z.object({
    segments: z.array(z.object({
      startMs: z.number().int().min(0),
      endMs: z.number().int().min(0),
    })),
    thresholdDb: z.number().optional(),
    minSilenceMs: z.number().optional(),
  }).optional(),
});

export type PlaybackBundleVM = z.infer<typeof PlaybackBundleVMSchema>;

// ---- EntitlementV3 ----
export const EntitlementV3Schema = z.object({
  plan: z.enum(["free", "pro"]),
  status: z.enum(["active", "grace", "expired", "unknown"]),
  renewsAt: z.string().datetime().optional(),
  source: z.enum(["apple", "google", "stripe", "internal", "revenuecat"]).optional(), // Phase 6.3: Added revenuecat
  limits: z.object({
    dailyGenerations: z.number().int().min(0),
    maxSessionLengthSec: z.number().int().min(0),
    offlineDownloads: z.boolean(),
  }),
  canCreateSession: z.boolean(),
  canGenerateAudio: z.boolean(),
  remainingFreeGenerationsToday: z.number().int().min(0),
  maxSessionLengthSecEffective: z.number().int().min(0),
});

export type EntitlementV3 = z.infer<typeof EntitlementV3Schema>;
