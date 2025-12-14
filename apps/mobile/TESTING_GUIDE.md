# Pre-roll Atmosphere Testing Guide

This guide helps you test the pre-roll atmosphere feature on iOS and Android devices.

## Prerequisites

1. **API Server Running**: Start the API server first
   ```bash
   pnpm -C apps/api dev
   ```

2. **Mobile App Running**: Start the Expo dev server
   ```bash
   pnpm -C apps/mobile start
   ```

3. **Device/Simulator**: Have an iOS simulator, Android emulator, or physical device ready

## Test Checklist

### 1. Verify Pre-roll Plays Within 300ms

**Steps**:
1. Open the app on a device/simulator
2. Navigate to Home screen
3. Create a new session or select an existing one
4. Navigate to Player screen
5. Tap "Load" to load the bundle
6. **Immediately tap "Play"** and start a stopwatch
7. Listen for pre-roll atmosphere to start

**Expected Result**: 
- Pre-roll should start within 100-300ms of tapping Play
- You should hear subtle pink/brown noise (very quiet, like "air" or "room tone")
- Volume should be very low (max 10%)

**Success Criteria**: ✅ Audio starts within 300ms

---

### 2. Test Crossfade to Main Mix

**Steps**:
1. Start playback (pre-roll should begin)
2. Wait for main tracks to load (usually 1-3 seconds)
3. Listen carefully to the transition

**Expected Result**:
- Pre-roll fades out smoothly over ~1.75 seconds
- Main mix (affirmations + binaural + background) fades in simultaneously
- No audible clicks, pops, or gaps
- Transition feels seamless, like "stepping into an environment"

**Success Criteria**: 
- ✅ Smooth crossfade (no artifacts)
- ✅ No noticeable "intro" feeling
- ✅ Pre-roll completely stops after crossfade

---

### 3. Test Pause During Pre-roll

**Steps**:
1. Tap "Play" to start pre-roll
2. **Immediately tap "Pause"** (before main mix loads)
3. Observe behavior

**Expected Result**:
- Pre-roll fades out quickly (300-500ms)
- App enters "paused" state
- No audio continues playing

**Success Criteria**: ✅ Pre-roll stops cleanly on pause

---

### 4. Test Resume from Pause During Pre-roll

**Steps**:
1. Start playback (pre-roll begins)
2. Pause before main mix loads
3. Tap "Play" again to resume

**Expected Result**:
- If main tracks not ready: Pre-roll restarts
- If main tracks ready: Goes directly to playing main mix
- No audio glitches

**Success Criteria**: ✅ Resume works correctly in both cases

---

### 5. Test Stop During Pre-roll

**Steps**:
1. Start playback (pre-roll begins)
2. **Immediately tap "Stop"** (before main mix loads)
3. Observe behavior

**Expected Result**:
- Pre-roll fades out quickly (200-300ms)
- App returns to "idle" state
- All audio stops

**Success Criteria**: ✅ Stop works cleanly during pre-roll

---

### 6. Test Rapid Play/Pause

**Steps**:
1. Rapidly tap Play/Pause 10 times in quick succession
2. Observe behavior

**Expected Result**:
- No crashes or errors
- State remains consistent
- Audio doesn't get stuck or overlap

**Success Criteria**: ✅ Handles rapid state changes gracefully

---

### 7. Test Session Switch During Pre-roll

**Steps**:
1. Start playback on Session A (pre-roll begins)
2. Navigate back to Home
3. Select Session B
4. Navigate to Player and tap Play

**Expected Result**:
- Pre-roll stops for Session A
- Pre-roll starts for Session B
- No audio overlap or conflicts

**Success Criteria**: ✅ Clean session switching

---

### 8. Test App Background/Foreground

**Steps**:
1. Start playback (pre-roll begins)
2. Background the app (home button/gesture)
3. Wait 5 seconds
4. Foreground the app

**Expected Result**:
- Audio continues (if background audio enabled)
- State remains consistent
- No crashes

**Success Criteria**: ✅ Handles background/foreground transitions

---

### 9. Test Audio Interruption

**Steps**:
1. Start playback (pre-roll begins)
2. Trigger system audio interruption:
   - iOS: Siri, phone call, Control Center audio
   - Android: Phone call, notification sound
3. Resume playback

**Expected Result**:
- Audio pauses gracefully
- Can resume after interruption
- State remains consistent

**Success Criteria**: ✅ Handles interruptions gracefully

---

## Loudness Verification

### Check Pre-roll Volume

The pre-roll should be:
- **Very quiet** (target: -38 LUFS)
- **Subtle** - should feel like "silence with substance"
- **Not noticeable as an intro** - if you notice it, it's too loud

### Fine-tuning Loudness

If the pre-roll is too loud or too quiet:

1. **Measure current loudness** using audio analysis tools (e.g., Audacity, iZotope RX)
2. **Adjust the generation script** (`apps/api/scripts/generate-preroll.ts`):
   - Change the `volume=-40dB` parameter
   - Re-run: `bun apps/api/scripts/generate-preroll.ts`
3. **Rebuild the app** to include the new asset

**Target**: -38 LUFS integrated loudness, ≤ -10 dBTP true peak

---

## Debugging

### Check Console Logs

Look for these log messages:
- `[AudioEngine] idle → preroll @ [timestamp]` - Pre-roll started
- `[AudioEngine] preroll → loading @ [timestamp]` - Loading main tracks
- `[AudioEngine] preroll → playing @ [timestamp]` - Crossfade complete

### Common Issues

**Pre-roll doesn't play**:
- Check if asset file exists: `apps/mobile/assets/audio/preroll_atmosphere.m4a`
- Check console for asset loading errors
- Verify expo-asset is working

**Pre-roll too loud/noticeable**:
- Reduce volume in generation script
- Regenerate asset
- Rebuild app

**Pre-roll doesn't stop**:
- Check crossfade logic
- Verify main tracks are loading
- Check state transitions in logs

---

## Success Criteria Summary

- ✅ Pre-roll starts within 300ms of Play tap
- ✅ No audible clicks/pops
- ✅ No noticeable "intro" feeling
- ✅ Smooth crossfade to main mix
- ✅ Pre-roll never persists once main mix is established
- ✅ Pause/Resume/Stop work correctly during pre-roll
- ✅ No state desync (UI matches audio state)
- ✅ Handles edge cases (rapid taps, interruptions, etc.)

---

## Reporting Results

After testing, document:
1. Device/OS tested on
2. Any issues found
3. Loudness perception (too loud/quiet/just right)
4. Timing measurements (actual pre-roll start time)
5. Any crashes or errors

