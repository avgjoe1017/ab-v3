# Production Instructions

This document contains instructions for deploying and running the Affirmation Beats V3 application in production.

## Pre-roll Atmosphere Asset

### Asset Location
The pre-roll atmosphere audio asset is located at:
- `apps/mobile/assets/audio/preroll_atmosphere.m4a`

### Asset Loading
The asset is loaded via Expo's Asset API in the AudioEngine. The require() path is resolved by Metro bundler at build time.

**Important**: The asset must be included in the app bundle. Ensure:
1. The file exists at `apps/mobile/assets/audio/preroll_atmosphere.m4a`
2. Metro bundler includes it in the bundle (it should automatically)
3. The asset is accessible offline (bundled assets are always available)

### Regenerating the Asset

If you need to regenerate or adjust the pre-roll asset:

```bash
# From project root
cd apps/api
bun scripts/generate-preroll.ts
```

The script will:
- Generate pink/brown noise mix
- Apply spectral shaping filters
- Normalize to target loudness
- Output to `apps/mobile/assets/audio/preroll_atmosphere.m4a`

### Loudness Adjustment

To fine-tune the loudness to exactly -38 LUFS:

1. Edit `apps/api/scripts/generate-preroll.ts`
2. Adjust the `volume=-40dB` parameter (line ~60)
3. Regenerate: `bun apps/api/scripts/generate-preroll.ts`
4. Rebuild the mobile app

**Note**: The current setting is -40 dB, which should be close to -38 LUFS. Use audio analysis tools to verify exact loudness if needed.

## Testing Pre-roll Functionality

See `apps/mobile/TESTING_GUIDE.md` for comprehensive testing instructions.

### Quick Test Checklist

1. ✅ Pre-roll starts within 300ms of Play tap
2. ✅ Smooth crossfade to main mix (no clicks/pops)
3. ✅ Pause/Resume/Stop work during pre-roll
4. ✅ No "intro" feeling (should feel like stepping into environment)
5. ✅ Volume is subtle (max 10% runtime, -38 LUFS target)

## Build Process

### Mobile App Build

```bash
# Development
pnpm -C apps/mobile start

# Production build (iOS)
pnpm -C apps/mobile ios --configuration Release

# Production build (Android)
pnpm -C apps/mobile android --configuration Release
```

### API Server Build

```bash
# Development
pnpm -C apps/api dev

# Production (requires Docker/containerization)
# See deployment docs for container setup
```

## Environment Variables

### API Server
- `DATABASE_URL` - SQLite/Postgres connection string
- `PORT` - Server port (default: 8787)

### Mobile App
- `API_BASE_URL` - API server URL (default: http://10.0.2.2:3000 for Android emulator)

## Asset Verification

Before deploying, verify the pre-roll asset:
1. File exists: `apps/mobile/assets/audio/preroll_atmosphere.m4a`
2. File size: ~200-300 KB (12 seconds, M4A, 128kbps)
3. Asset loads in app (check console for errors)

## Troubleshooting

### Pre-roll doesn't play
- Check console for asset loading errors
- Verify file exists in bundle
- Check Metro bundler includes the asset

### Pre-roll too loud/quiet
- Regenerate with adjusted volume parameter
- Rebuild app
- Test on device (simulator may have different audio characteristics)

### Asset not found errors
- Ensure asset is in correct location
- Check Metro bundler configuration
- Verify require() path in AudioEngine

