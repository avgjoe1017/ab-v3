# AFFIRMATION BEATS — V3 START-FRESH ARCHITECTURE (Authoritative)

This repo skeleton is organized to enforce the V3 architecture:

- Single playback model: **single merged affirmations track** + looped binaural + looped background
- `expo-audio` only (no `expo-av`)
- Drafts are client-only (no fake IDs); server accepts UUIDs only
- Versioned schemas + migrations at boundaries (contracts package)
- UI reads only `EntitlementV3` (derived fields included)

The full implementation details should follow this spec, and any violation is a bug.
