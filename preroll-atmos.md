# TASK: Implement V3 “Pre-roll Atmosphere” (Not an Intro) + AudioEngine State Transitions

You are implementing an audio UX feature for Affirmation Beats V3.

## 0) Non-Negotiable Product Context (Read First)

- V3 sessions are **infinite loop**. No session end.
- Pace is **constant**: slow, deliberate.
- Each affirmation is spoken **twice** with slight prosody variation; silence happens **after the second read**.
- Playback model is **3 tracks**:
  - Track A: merged affirmations (single file, looped)
  - Track B: binaural (looped)
  - Track C: background ambience (looped)
- Audio is owned by a **singleton AudioEngine**. Screens do not own audio.
- We are adding AI later; this task is **non-AI** and must be deterministic and stable.

This task adds a “pre-roll atmosphere” layer that buys time while the main audio loads, without feeling like an intro.

---

## 1) Feature Goal: “Pre-roll Atmosphere” (Not an Intro)

### The user experience goal
When the user taps Play, audio should begin quickly (within 100–300ms) even if:
- the playback bundle is still fetching
- `ensure-audio` job is running
- the merged affirmations track is not yet ready
- background/binaural assets are not yet ready
- the audio engine is warming up

This is NOT a branded intro. The user should feel like they stepped into an environment already present.

### Strict behavioral rules
- Pre-roll starts immediately on Play intent.
- Pre-roll is extremely subtle and non-melodic.
- Pre-roll is temporary and must fade out once the 3 main tracks are ready.
- Pre-roll must never “stop” abruptly (no hard cut). It must crossfade out.
- Pre-roll must not become part of the session’s background ambience.
- Pre-roll must not be audible as a separate “event.” If users notice it, it’s too loud or too distinct.

---

## 2) Audio Asset Spec (Exact Characteristics)

You need to create one bundled local audio asset:

### File
- Filename: `preroll_atmosphere.wav` (preferred) or `preroll_atmosphere.caf` (iOS-friendly) or `preroll_atmosphere.m4a` (acceptable)
- Bundled locally in the app so it is **always instantly available** offline
- Duration: **12 seconds**
  - This is long enough to cover slow loads but short enough to avoid “loop identity”
- Looping:
  - The pre-roll player MAY loop if needed, but only while in pre-roll state.
  - If looped, loop must be seamless (prefer uncompressed WAV/CAF to avoid encoder loop gaps).

### Sound design requirements
The pre-roll must sound like “air” / “room tone” / “near-silence with texture”.

**Noise type**
- Base: pink noise (1/f), very low level
- Layer: extremely subtle brown noise (1/f²) to add warmth, also very low level
- Optional: tiny amount of shaped “room tone” (no identifiable environment, no birds, no water, no wind gusts)

**Spectrum**
- High-pass filter: ~60–80 Hz (remove rumble)
- Low-pass filter: ~8–10 kHz (remove hiss/brightness)
- Mid presence dip: -2 to -4 dB around ~1.5–3 kHz (avoid “ear fatigue”)
- No narrow resonant peaks (no tones, no whistles)

**Dynamics**
- No rhythmic motion, no pulsing, no modulation that implies a “start”
- No transient clicks at file start/end
- No distinct “fade-in” baked into the file (fade should be runtime-controlled)

**Loudness**
- Target integrated loudness: **-38 LUFS** (very quiet)
- True peak: **≤ -10 dBTP**
- This should sit *under* the eventual background layer and be perceived as “silence with substance”.

**Stereo field**
- Very mild stereo width or mono is fine.
- Avoid hard stereo artifacts or spatial movement.

**Prohibited**
- Melody, chords, musical notes
- Chimes, stings, brand marks
- Voice or whispers
- Nature sound clichés (waves, rain, birds)
- Any obvious loop point

Deliverable expectation: include the audio file in the repo and ensure it loads instantly on both iOS/Android.

---

## 3) Implementation Requirements (AudioEngine + State Machine)

### Library requirement
- Use `expo-audio` (not expo-av).

### Architecture requirement
- Pre-roll logic must live inside the AudioEngine singleton.
- No screen may directly manage pre-roll playback.
- Pre-roll must be driven by engine state transitions.

---

## 4) AudioEngine States (Including Pre-roll)

Implement/extend the AudioEngine state machine to include pre-roll explicitly:

### Required states
- `idle`
- `preroll`  ✅ new
- `loading`  (loading bundle and/or initializing players)
- `ready`    (players instantiated, can start playback)
- `playing`
- `paused`
- `stopping`
- `error`

### Required invariants
- Pre-roll can only occur before `playing` (or while transitioning to `playing`).
- Pre-roll must never run concurrently with the full 3-track mix at audible level.
  - It may overlap briefly during crossfade, but must end fully.
- Any transition to `stopping` must stop pre-roll immediately (but with safe fade-out if possible).
- Navigation events must not affect these states.

---

## 5) State Transition Diagram (Detailed)

### Primary “tap play” flow (happy path)
1. `idle` → user taps Play
2. Engine enters `preroll`
   - start pre-roll player immediately (<=300ms)
3. In parallel, engine begins load sequence:
   - fetch playback bundle if not already present
   - ensure audio job if needed
   - initialize 3 players (affirmations/background/binaural)
4. Once all three players are ready:
   - engine transitions `preroll` → `loading` (or keep `loading` as a parallel internal phase)
   - start the 3 tracks muted (volume 0)
   - then transition to `playing`
5. Crossfade:
   - fade pre-roll out over 1.5–2.0 seconds
   - fade main mix in over the same window
6. After fade completes:
   - stop and unload pre-roll player
   - engine remains `playing`

### If loading is fast (<500ms)
- Still start pre-roll, but it may only be audible briefly.
- Crossfade must be smooth; no “blip”.

### If loading takes longer (seconds)
- Pre-roll continues, looping if needed.
- Do not increase volume; do not add UI “intro”.
- If loading exceeds 8 seconds:
  - continue pre-roll but also surface a subtle UI text: “Preparing your session…”
  - do NOT show spinners if avoidable; keep it calm.

### Pause/Resume during pre-roll
- If user presses pause while pre-roll is active:
  - pre-roll should fade out quickly (300–500ms) and pause state is entered.
- Resume from pause:
  - if main tracks not ready: restart pre-roll and return to `preroll`
  - if main tracks ready: go directly to `playing` without pre-roll (or with a very brief pre-roll if it helps avoid audio pop)

### Stop during pre-roll
- Stop immediately moves to `stopping`, then `idle`
- Pre-roll fades out fast (200–300ms) and is unloaded

---

## 6) Crossfade & Volume Rules (Exact)

### Pre-roll volume
- Runtime volume cap: **0.10** (10%) or lower depending on expo-audio scale
- Pre-roll should never exceed perceived loudness of -38 LUFS target in file
- Fade-in: 150–300ms
- Fade-out (crossfade): 1500–2000ms

### Main mix fade-in
- Start all 3 main players at volume 0
- Fade to target mix over 1500–2000ms
- Target mix comes from `PlaybackBundleVM.mix` (or default)
- Ensure binaural/background loops begin aligned when possible (start them together)

### Avoid audible artifacts
- No “click” when starting/stopping pre-roll
- No “pop” when main tracks begin
- If expo-audio requires, begin playback at 0 volume first, then fade in.

---

## 7) Concurrency & Race Condition Requirements (Critical)

AudioEngine must serialize commands:
- `load()`
- `play()`
- `pause()`
- `stop()`
- `seek()`

Implementation approach:
- Use an internal async queue where each command awaits prior commands.
- Coalesce redundant calls:
  - multiple `setMix` calls can override previous pending ones
  - rapid play/pause should not spawn overlapping start/stop operations

Pre-roll must be controlled by the same queue to avoid:
- pre-roll playing after main mix started
- pre-roll not stopping on stop
- multiple pre-roll players accidentally created

---

## 8) Integration Points

### Where pre-roll starts
- When user indicates intent to play:
  - `AudioEngine.play()` should:
    - if state is `idle` and no loaded bundle: begin pre-roll and load
    - if state is `ready`: start main mix (and optionally very brief pre-roll only if needed to avoid pops)
    - if state is `paused`: resume appropriate layer

### Where pre-roll stops
- When transitioning to `playing` and crossfade completes:
  - pre-roll must be stopped and released

### Ownership of the asset
- Pre-roll asset must be referenced by local URI / bundled asset loader.
- Do not fetch pre-roll from network.

---

## 9) Testing Requirements (You Must Add These)

### Manual test matrix (must pass on iOS + Android)
1. Tap Play on cold start (no cache)
2. Tap Play with warm cache
3. Tap Play then immediately Pause
4. Tap Play then immediately Stop
5. Rapid Play/Pause x10
6. Switch sessions while loading (pre-roll active)
7. App background/foreground transitions during:
   - pre-roll
   - loading
   - playing
8. Audio interruption (call, Siri, etc.) during pre-roll and during playing

### Success criteria
- User hears something within 300ms of tapping Play (pre-roll)
- No audible clicks/pops
- No noticeable “intro”
- Pre-roll never persists once main mix is established
- No state desync where UI says playing but audio is silent

---

## 10) Deliverables

1. Add bundled pre-roll audio asset file meeting the spec
2. Implement `preroll` state in AudioEngine
3. Implement pre-roll start/stop + crossfade behavior
4. Ensure no screen-level audio ownership
5. Add minimal logging (dev-only) for state transitions:
   - `idle → preroll → loading → playing`
   - include timestamps for latency measurement
6. Provide a short note in code: “Pre-roll atmosphere is not an intro.”

---

## 11) Notes on “Do Not Break V3 Principles”

Pre-roll must feel like:
- stepping into an already-existing environment

It must not feel like:
- a brand flourish
- a meditation intro
- a loading sound
- a feature

If it feels noticeable, reduce volume and simplify spectrum.

End of task.
