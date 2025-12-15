# Affirmation Beats V3 - Punch List

Date: 2025-12-14  
Codebase: `ab zip 3.zip`

---

## P0 - Must-fix (security + correctness)

- [ ] **Rotate and remove committed secrets**
  - Files:
    - `.env` (contains a real `ELEVENLABS_API_KEY`)
    - Any docs/scripts that reference real keys (search `sk_`, `sk-`, `OPENAI_API_KEY`)
  - Fix:
    - Rotate keys immediately.
    - Remove `.env` from the repo; keep it local only.
    - Add `.env.example` with safe placeholders + required vars list.
    - Add a pre-commit secret scan (or CI check) to block `sk_`/`sk-` patterns.

- [ ] **Stop mutating global `process.env` inside request handlers**
  - Files:
    - `apps/api/src/index.ts` (playback bundle route overwrites `process.env.API_BASE_URL`)
  - Why:
    - Concurrency hazard: two requests can interleave and cause wrong base URLs / hard-to-repro bugs.
  - Fix:
    - Refactor `getBinauralAsset/getBackgroundAsset` to accept an explicit `baseUrl` param.
    - Remove the temporary `process.env` override entirely.
  - Acceptance:
    - No request path mutates global env; concurrent playback-bundle calls return correct URLs.

- [ ] **Fix `/assets/*` Range handling to stream only the requested bytes**
  - Files:
    - `apps/api/src/index.ts` (Range handler calls `Bun.file(...).arrayBuffer()` then slices)
  - Why:
    - Reads the entire audio file into memory for every Range request (worst case on iOS).
  - Fix (Bun-friendly approach):
    - Use `const chunk = Bun.file(filePath).slice(start, end + 1);` (or an equivalent stream-only range response).
    - Return `chunk` directly rather than materializing the full array buffer.
  - Acceptance:
    - Memory does not spike when iOS requests multiple ranges.
    - Large `.m4a` files begin playback quickly without server stalls.

- [ ] **Make API responses V3-contract strict (remove legacy fields)**
  - Files:
    - `packages/contracts/src/schemas.ts` (`SessionV3Schema`)
    - `apps/api/src/index.ts`
      - `GET /sessions` returns `{ id, title, durationSec }`
      - `GET /sessions/:id` returns `durationSec`, `affirmationSpacingMs`, `pace` (not forced to `"slow"`)
  - Fix:
    - Define a list-item schema (or return `SessionV3[]` and keep list lightweight via select + map).
    - In `GET /sessions/:id`, construct exactly `SessionV3`:
      - omit `durationSec` + `affirmationSpacingMs`
      - force `pace: "slow"` (or migrate DB to always store `"slow"`)
  - Acceptance:
    - `SessionV3Schema.parse(...)` succeeds for both single and list endpoints.
    - Mobile types align with contracts; no hidden drift.

- [ ] **Remove log artifacts and non-source files from the repo**
  - Files:
    - `bg-api.log`, `bg-api-2.log` (and any other runtime logs)
  - Fix:
    - Delete from repo, add to `.gitignore`.
  - Acceptance:
    - Repo contains only source + intentional docs/assets.

---

## P1 - Stability + performance

- [ ] **Standardize Content-Type handling for audio assets**
  - Files:
    - `apps/api/src/index.ts` (`/assets/*` handler)
  - Fix:
    - Add Content-Type for `.mp3` (`audio/mpeg`) and any other formats you serve.
    - Keep `.m4a` as `audio/mp4`.
  - Acceptance:
    - iOS/Android players consistently receive correct MIME types.

- [ ] **Make job execution restart-safe**
  - Files:
    - `apps/api/src/services/jobs.ts`
  - Why:
    - `triggerJobProcessing()` is fire-and-forget in-process; server restart can strand jobs in `"processing"`.
  - Fix:
    - Add a minimal worker loop (same process is fine for now) that periodically:
      - reclaims stale `"processing"` jobs to `"pending"`
      - drains `"pending"` jobs deterministically
  - Acceptance:
    - Restarting API mid-generation does not leave jobs stuck permanently.

- [ ] **Make merged-audio URL construction unambiguous**
  - Files:
    - `apps/api/src/index.ts` (`GET /sessions/:id` and `GET /sessions/:id/playback-bundle`)
  - Fix:
    - Store `mergedAudioAsset.url` consistently as a path relative to `apps/api` (or as an absolute file path) and centralize URL generation in one helper.
  - Acceptance:
    - Both endpoints return the same reachable URL for the merged affirmations asset.

- [ ] **Normalize DB to V3 invariants (optional but recommended)**
  - Files:
    - Prisma schema + migrations (where `Session` is defined)
    - `apps/api/src/services/audio/generation.ts` already forces `effectivePace = "slow"`
  - Fix:
    - Set `pace` default `"slow"` and remove unused legacy fields if they’re no longer needed.
  - Acceptance:
    - DB reflects V3 truth; API doesn’t have to compensate.

---

## P2 - Mobile dev ergonomics + UX correctness

- [ ] **Replace hardcoded LAN IP and forced device mode**
  - Files:
    - `apps/mobile/src/lib/config.ts`
  - Fix:
    - Read host/IP from `EXPO_PUBLIC_API_BASE_URL` (or Expo `extra`) with safe fallbacks.
    - Default `FORCE_PHYSICAL_DEVICE` to `false`.
  - Acceptance:
    - No source edit required to switch networks; iOS sim / Android emu / device all work.

- [ ] **Wire player controls to engine state (remove non-functional affordances)**
  - Files:
    - `apps/mobile/app/player.tsx`
  - Fix:
    - Ensure play/pause icon reflects actual engine status.
    - Hide or disable skip controls until implemented.
  - Acceptance:
    - UI controls always match real playback behavior.

- [ ] **Offline-first option for playback bundles**
  - Files:
    - Mobile: download + local file URI resolver
    - API: optional signed URLs or direct asset URLs (as-is is fine for MVP)
  - Fix:
    - Download the 3-track bundle once; prefer local URIs during playback.
  - Acceptance:
    - Sessions play without a network after initial download.

---

## P3 - Quality upgrades (high impact polish)

- [ ] **Add loudness measurement and/or normalization for merged affirmations**
  - Files:
    - `apps/api/src/services/audio/generation.ts` (post-merge step)
  - Fix:
    - Measure LUFS once per merged file; store in `AudioAsset.metaJson`.
    - Optionally normalize to a target level for consistent perceived volume.
  - Acceptance:
    - All sessions have consistent output loudness across devices and content.

- [ ] **Reduce loop artifacts (gapless strategy)**
  - Files:
    - Audio output format + `AudioEngine` looping strategy
  - Fix options:
    - Prefer gapless-friendly container (often AAC `.m4a`) for affirmations merge.
    - Or implement seamless looping via A/B players and crossfade at loop boundaries.
  - Acceptance:
    - No audible click/gap at loop boundaries for affirmations/background.

---

## Innovation track (build on what V3 already has)

- [ ] **Automated “slow mix” curves (premium feel without AI cost)**
  - Files:
    - `packages/audio-engine/src/AudioEngine.ts`
  - Idea:
    - Slowly ramp background/binaural levels over the first 60–120s, then stabilize.
    - Optional “focus mode” that subtly changes the mix over time.
  - Acceptance:
    - Sessions feel dynamic while staying calm and predictable.

- [ ] **Deterministic personalization without generation**
  - Files:
    - Mobile session builder + API session creation
  - Idea:
    - Curated library + smart ordering rules (no continuous TTS/LLM cost).
  - Acceptance:
    - “Personal” sessions feel tailored even before adding AI writing.

---

## Fast verification checklist (after P0/P1)

- [ ] `GET /sessions/:id` passes `SessionV3Schema.parse(...)`
- [ ] `GET /sessions` returns a contract-defined list shape (no stray legacy fields)
- [ ] iOS playback works for large `.m4a` without server memory spikes
- [ ] playback-bundle returns correct URLs under concurrent requests
- [ ] Restarting API mid-job does not strand jobs in `"processing"`
