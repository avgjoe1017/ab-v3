# Quick Setup Guide

## 1. Configure TTS (Optional but Recommended)

### Option A: Interactive Setup (Easiest)
```bash
bun apps/api/scripts/setup-tts.ts
```

### Option B: Manual Setup
1. Edit `apps/api/.env`
2. Add your TTS provider configuration:
   ```bash
   # For OpenAI (recommended)
   TTS_PROVIDER=openai
   OPENAI_API_KEY=sk-your-key-here
   ```
3. Verify:
   ```bash
   bun apps/api/scripts/verify-tts.ts
   ```

**Get API Keys:**
- OpenAI: https://platform.openai.com/api-keys
- ElevenLabs: https://elevenlabs.io/app/settings/api-keys
- Azure: https://portal.azure.com (create Speech resource)

See `MD_DOCS/TTS_SETUP_GUIDE.md` for detailed instructions.

---

## 2. Start the API Server

```bash
pnpm -C apps/api dev
```

The API will run on `http://localhost:8787`

**Keep this terminal open** - the API must stay running.

---

## 3. Start the Mobile App

In a **new terminal**:

```bash
pnpm -C apps/mobile start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app

---

## 4. Test Pre-roll Feature

1. Open app → Home screen
2. Select a session → Player screen
3. Tap "Load" → Loads playback bundle
4. Tap "Play" → Pre-roll should start within 300ms!

**Use the testing checklist:** `MD_DOCS/TESTING_CHECKLIST.md`

---

## 5. Test TTS (if configured)

1. Create a new session in the app
2. Generate audio
3. Play the session
4. You should hear real TTS instead of beeps!

**Check API logs** for TTS status:
- `[TTS] openai generating...` = Working ✅
- `[TTS] openai failed, falling back to beep` = Issue ⚠️

---

## Next Steps

### Immediate Testing
- [ ] Complete pre-roll testing matrix (`MD_DOCS/TESTING_CHECKLIST.md`)
- [ ] Test TTS generation with real sessions
- [ ] Verify all UI features work

### Production Readiness
See `MD_DOCS/PRODUCTION_READINESS_PLAN.md` for:
- Authentication setup
- Database migration
- Cloud storage
- Error logging
- And more...

---

## Troubleshooting

### TTS Not Working?
1. Check API key is set: `cat apps/api/.env | grep API_KEY`
2. Verify provider: `cat apps/api/.env | grep TTS_PROVIDER`
3. Run verification: `bun apps/api/scripts/verify-tts.ts`
4. Check API server logs for errors

### Pre-roll Not Playing?
1. Check console logs for asset loading errors
2. Verify asset exists: `apps/mobile/assets/audio/preroll_atmosphere.m4a`
3. Check AudioEngine state transitions in logs

### API Connection Issues?
1. Verify API is running on port 8787
2. Check `apps/mobile/src/lib/config.ts` for correct URL
3. For physical device: Use your computer's IP address

---

## Documentation

- **TTS Setup:** `MD_DOCS/TTS_SETUP_GUIDE.md`
- **Testing Guide:** `MD_DOCS/TESTING_CHECKLIST.md`
- **Production Plan:** `MD_DOCS/PRODUCTION_READINESS_PLAN.md`
- **Pre-roll Testing:** `apps/mobile/TESTING_GUIDE.md`
