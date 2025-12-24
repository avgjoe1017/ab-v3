# Solfeggio Tones Integration

## Overview

Solfeggio tones are now fully integrated into the Affirmation Beats V3 application. Sessions can use either binaural beats or solfeggio frequencies as the brain layer audio.

## Available Solfeggio Frequencies

11 solfeggio frequencies are available (based on research from `Brain/affirmation_research.md`):

| Frequency | Traditional Association | Research-Based Use Cases |
|-----------|-------------------------|-------------------------|
| **174 Hz** | Foundation & Healing | Relaxation & Stress Relief (grounding, pain/stress relief) |
| **285 Hz** | Tissue Restoration | Physical healing, cellular rejuvenation |
| **396 Hz** | Liberation from Fear & Guilt | Energy Boost & Motivation, Meditation (grounding), Anxiety Relief (fear-based) |
| **417 Hz** | Facilitating Change | Deep Sleep (emotional release, trauma clearing) |
| **432 Hz** | Natural frequency | Meditation & Mindfulness (peaceful, harmonious feelings) |
| **528 Hz** | Transformation & Love (Miracle Tone) | Deep Sleep, Relaxation, Pre-Performance (scientifically studied: reduced cortisol, improved mood) |
| **639 Hz** | Harmonious Relationships | Connection, empathy, communication |
| **741 Hz** | Awakening Intuition & Expression | Focus & Concentration, Creativity (mental clarity, problem-solving) |
| **852 Hz** | Spiritual Awareness & Anxiety Relief | Anxiety Relief (replacing negative thoughts, calming overactive mind) |
| **963 Hz** | Divine Consciousness | Meditation & Mindfulness (spiritual awakening, pineal gland activation) |
| **40 Hz** | Lower frequency | (Available but less commonly used) |

**Note**: Research shows that 528 Hz has preliminary scientific support (reduced cortisol, improved sleep quality in studies), while most other frequencies are based on traditional/spiritual use and anecdotal reports.

## Architecture Changes

### 1. Database Schema
- Added `solfeggioHz` field to `Session` model (optional Float)
- Migration: `20250115000000_add_solfeggio_support`

### 2. Contracts (Schemas)
- **SessionV3Schema**: Added optional `solfeggioHz` field
- **DraftSessionSchema**: Added optional `solfeggioHz` field
- **PlaybackBundleVMSchema**: 
  - Made `binaural` optional
  - Added optional `solfeggio` object with same structure as binaural
  - Added `solfeggioLUFS` to loudness object
  - Validation: Either binaural or solfeggio must be provided

### 3. API Changes

#### Asset Resolution
- **`getSolfeggioAsset(hz, apiBaseUrl)`**: New function in `apps/api/src/services/audio/assets.ts`
  - Resolves solfeggio assets by frequency
  - Returns platform-aware URLs (iOS: S3 HTTPS, Android: local HTTP)
  - Falls back to 528Hz if requested frequency not found

#### Session Creation
- **POST /sessions**: Now accepts optional `solfeggioHz` in request body
  - If `solfeggioHz` is provided, session uses solfeggio instead of binaural
  - If not provided, uses binaural (existing behavior)

#### Playback Bundle
- **GET /sessions/:id/playback-bundle**: 
  - Returns `solfeggio` object if session has `solfeggioHz`
  - Returns `binaural` object if session has `frequencyHz` (default)
  - Only one is included (mutually exclusive)

## Usage

### Creating a Session with Solfeggio

```typescript
// Example 1: Create session with 528Hz solfeggio (for sleep/relaxation)
const response = await fetch('/sessions', {
  method: 'POST',
  body: JSON.stringify({
    localDraftId: '...',
    title: 'Love and Transformation',
    affirmations: ['...'],
    voiceId: 'alloy',
    pace: 'slow',
    goalTag: 'sleep', // Optional: helps with automatic mapping
    solfeggioHz: 528, // Use solfeggio instead of binaural
  }),
});

// Example 2: Create session with 741Hz solfeggio (for focus)
const focusResponse = await fetch('/sessions', {
  method: 'POST',
  body: JSON.stringify({
    localDraftId: '...',
    title: 'Deep Focus Session',
    affirmations: ['...'],
    voiceId: 'onyx',
    pace: 'slow',
    goalTag: 'focus',
    solfeggioHz: 741, // Mental clarity and problem-solving
  }),
});
```

### Automatic Solfeggio Mapping

The `getSolfeggioForGoalTag()` function (in `packages/contracts/src/session-frequency.ts`) provides research-based mappings:

- **focus** → 741 Hz (mental clarity, problem-solving)
- **sleep** → 528 Hz (miracle tone, sleep support)
- **anxiety/anxiety-relief** → 852 Hz (anxiety relief, replacing negative thoughts)
- **meditate** → 963 Hz (spiritual awakening, deep meditation)
- **wake-up/coffee-replacement** → 396 Hz (motivation, liberation from fear)
- **creativity** → 741 Hz (intuition, expression)
- **pre-performance** → 528 Hz (confidence, transformation)

You can use this function to automatically suggest solfeggio frequencies based on goalTag, or allow users to manually select.

### Playback Bundle Response

When a session uses solfeggio, the playback bundle will include:

```json
{
  "bundle": {
    "sessionId": "...",
    "affirmationsMergedUrl": "...",
    "background": { ... },
    "solfeggio": {
      "urlByPlatform": {
        "ios": "https://...",
        "android": "http://..."
      },
      "loop": true,
      "hz": 528
    },
    "mix": { ... }
  }
}
```

## Mobile App Integration

The mobile app already has UI support for solfeggio:
- `AudioSettingsPanel.tsx` - Brain layer toggle (Binaural/Solfeggio/Off)
- `bundledAssets.ts` - Solfeggio asset resolution
- `affirmationPack.ts` - Solfeggio preset selection

The AudioEngine can use the same `binPlayer` for solfeggio - it just needs to use the `solfeggio.urlByPlatform` URL from the playback bundle instead of `binaural.urlByPlatform`.

## Testing

Run the test script to verify all solfeggio assets are accessible:

```bash
cd apps/api
bun scripts/test-solfeggio-integration.ts
```

All 11 frequencies should pass.

## Next Steps

1. ✅ Database schema updated
2. ✅ API endpoints support solfeggio
3. ✅ Asset resolution working
4. ⏳ Update mobile app AudioEngine to use solfeggio URL when present
5. ⏳ Test end-to-end: Create session → Get playback bundle → Play solfeggio

## Research-Based Implementation

This implementation is informed by research from `Brain/affirmation_research.md`:

### Key Insights from Research

1. **Binaural Beats**: Scientifically studied brainwave entrainment (mixed evidence, but some support for theta/alpha/delta ranges)
2. **Solfeggio Frequencies**: Traditional/spiritual use with limited scientific validation, but 528 Hz shows preliminary research support
3. **Combined Approach**: Research suggests combining both - binaural for brainwave entrainment, solfeggio for emotional/spiritual aspect

### Use Case Mapping (from Research)

The research provides a use case table mapping goals to frequencies:

| Goal | Binaural Beat | Solfeggio Frequency |
|------|---------------|-------------------|
| Focus & Concentration | Beta (13-20 Hz) or Gamma (30-40 Hz) | 741 Hz |
| Relaxation & Stress Relief | Alpha (8-12 Hz) or Theta (5-7 Hz) | 174 Hz or 528 Hz |
| Deep Sleep | Delta (0.5-4 Hz) | 528 Hz or 417 Hz |
| Anxiety Relief | Theta or low-Alpha (4-8 Hz) | 852 Hz or 396 Hz |
| Meditation & Mindfulness | Theta (5-7 Hz) or Alpha (8-10 Hz) | 963 Hz or 396 Hz |
| Energy Boost & Motivation | Beta to Gamma (15-30 Hz) | 396 Hz or 741 Hz |

Our implementation allows users to choose either binaural or solfeggio, with automatic suggestions based on goalTag.

## Notes

- Solfeggio and binaural are mutually exclusive - a session uses one or the other
- Default behavior (no solfeggioHz) uses binaural beats
- Solfeggio files follow pattern: `solfeggio_{hz}_3min.m4a`
- All solfeggio files are 3-minute loops, same as binaural beats
- Research-based mappings available via `getSolfeggioForGoalTag()` function
- 528 Hz has preliminary scientific support (reduced cortisol, improved sleep quality)

