# Pre-roll Atmosphere Asset

This directory should contain the pre-roll atmosphere audio file.

## Required File

**Filename**: `preroll_atmosphere.m4a` (or `.wav` / `.caf`)

## Audio Specifications

- **Duration**: 12 seconds
- **Format**: M4A (preferred), WAV, or CAF
- **Loudness**: -38 LUFS (integrated)
- **True Peak**: ≤ -10 dBTP
- **Noise Type**: Pink/brown noise with spectral shaping
  - High-pass filter: 60-80 Hz
  - Low-pass filter: 8-10 kHz
  - Mid presence dip: -2 to -4 dB at 1.5-3 kHz
- **Volume Cap**: Runtime max 0.10 (10%)
- **Looping**: Seamless loop capability (prefer uncompressed for no encoder gaps)

## Purpose

The pre-roll atmosphere is **not an intro**. It's designed to feel like stepping into an already-existing environment. It plays immediately (within 100-300ms) when the user taps Play, buying time while the main 3-track audio bundle loads.

## Implementation Notes

Once the file is created, update `packages/audio-engine/src/AudioEngine.ts` in the `getPrerollAssetUri()` method to load it using Expo's asset system:

```typescript
import { Asset } from 'expo-asset';

// In getPrerollAssetUri():
const asset = Asset.fromModule(require('../../mobile/assets/audio/preroll_atmosphere.m4a'));
await asset.downloadAsync();
return asset.localUri || asset.uri;
```

Or use a simpler approach with `require()` if the asset is properly configured in the Expo app.

## See Also

- `preroll-atmos.md` - Full specification
- `PROGRESS.md` - Implementation progress

