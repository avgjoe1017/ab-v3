# Pre-roll Atmosphere Testing Summary

**Date**: January 2025  
**Status**: ✅ Setup Complete - Ready for Manual Testing

## Setup Completed

### ✅ Fixed Issues
1. **React Types Version**: Updated `@types/react` from `^19.2.7` to `~19.1.10` for Expo compatibility
2. **API Port Configuration**: Updated API_BASE_URL to use port 8787 (was 3000)
3. **Platform Detection**: Added Platform.OS detection for Android/iOS API URL differences

### ✅ Verified
- Pre-roll asset exists: `apps/mobile/assets/audio/preroll_atmosphere.m4a`
- Code compiles without errors
- Dependencies installed correctly
- Expo dev server can start

## How to Test

### 1. Start API Server
```bash
pnpm -C apps/api dev
```
The API will run on `http://localhost:8787`

### 2. Start Mobile App
```bash
pnpm -C apps/mobile start
```
This will start the Expo dev server. Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

### 3. Test Pre-roll Functionality

#### Quick Test Flow:
1. **Open app** on device/simulator
2. **Navigate to Home** screen
3. **Create or select a session**
4. **Navigate to Player** screen
5. **Tap "Load"** to load the playback bundle
6. **Tap "Play"** and immediately start timing

#### What to Verify:

**✅ Pre-roll Start Time (<300ms)**
- Start stopwatch when tapping Play
- Should hear subtle atmosphere within 100-300ms
- Very quiet pink/brown noise ("air" or "room tone")

**✅ Crossfade Quality**
- After 1-3 seconds, main mix should fade in
- Pre-roll should fade out smoothly over ~1.75 seconds
- No clicks, pops, or gaps
- Should feel seamless, like "stepping into environment"

**✅ Controls During Pre-roll**
- **Pause**: Should fade out pre-roll quickly (300-500ms)
- **Resume**: Should restart pre-roll or go to main mix
- **Stop**: Should fade out quickly (200-300ms) and return to idle

**✅ Volume Level**
- Should be very subtle (max 10% runtime)
- Should NOT feel like an "intro"
- If noticeable, it's too loud - needs adjustment

### 4. Check Console Logs

Look for these state transitions in the console:
```
[AudioEngine] idle → preroll @ [timestamp]
[AudioEngine] preroll → loading @ [timestamp]  
[AudioEngine] preroll → playing @ [timestamp]
```

If you see errors about asset loading, check:
- Asset file exists in bundle
- Metro bundler includes the asset
- expo-asset is working

## Expected Behavior

### Happy Path:
1. User taps Play → Pre-roll starts within 300ms
2. Pre-roll plays subtle atmosphere (very quiet)
3. Main tracks load in background (1-3 seconds)
4. Smooth crossfade: pre-roll out, main mix in (1.75s)
5. Pre-roll stops completely, main mix continues

### Edge Cases:
- **Fast load (<500ms)**: Pre-roll may only play briefly, still crossfades smoothly
- **Slow load (>8s)**: Pre-roll continues looping until ready
- **Pause during pre-roll**: Fades out quickly, can resume
- **Stop during pre-roll**: Fades out, returns to idle

## Troubleshooting

### Pre-roll doesn't play
- Check console for errors
- Verify asset file exists: `apps/mobile/assets/audio/preroll_atmosphere.m4a`
- Check Metro bundler output for asset inclusion
- Try regenerating asset: `bun apps/api/scripts/generate-preroll.ts`

### Asset loading errors
- The require() path may need adjustment based on Metro config
- Check `packages/audio-engine/src/AudioEngine.ts` `getPrerollAssetUri()` method
- May need to use `apps/mobile/src/lib/prerollAsset.ts` helper instead

### API connection issues
- Verify API is running on port 8787
- For Android emulator: API_BASE_URL should be `http://10.0.2.2:8787`
- For iOS simulator: API_BASE_URL should be `http://localhost:8787`
- For physical device: Use your computer's local IP (e.g., `http://192.168.1.x:8787`)

### Pre-roll too loud/quiet
- Current setting: -40 dB (targeting -38 LUFS)
- To adjust: Edit `apps/api/scripts/generate-preroll.ts`, change `volume=-40dB`
- Regenerate: `bun apps/api/scripts/generate-preroll.ts`
- Rebuild app

## Success Criteria

- ✅ Pre-roll starts within 300ms
- ✅ No audible clicks/pops
- ✅ Smooth crossfade (no gaps)
- ✅ No "intro" feeling (subtle, like stepping into environment)
- ✅ Pre-roll stops after crossfade
- ✅ All controls work during pre-roll
- ✅ State transitions are correct

## Next Steps After Testing

1. **Document Results**: Record actual timing, any issues, loudness perception
2. **Fine-tune Loudness**: Adjust if needed to exactly -38 LUFS
3. **Fix Any Issues**: Address bugs or edge cases found
4. **Update PROGRESS.md**: Document test results and any adjustments made

## Files to Reference

- `apps/mobile/TESTING_GUIDE.md` - Detailed testing procedures
- `MD_DOCS/PREROLL_TESTING_STATUS.md` - Testing status and checklist
- `PRODUCTION_INSTRUCTIONS.md` - Asset management and deployment
- `preroll-atmos.md` - Original specification

---

**Ready to test!** The Expo dev server should be running. Open the app on a device/simulator and follow the test flow above.

