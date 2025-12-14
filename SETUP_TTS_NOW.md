# Quick TTS Setup - Get Real Audio Now

You're currently hearing beeps because TTS isn't configured. Let's fix that in 2 minutes.

## Option 1: OpenAI TTS (Recommended - Easiest)

### Step 1: Get API Key
1. Go to https://platform.openai.com/api-keys
2. Sign in or create account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

### Step 2: Configure
Edit `apps/api/.env` and add:
```bash
TTS_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

### Step 3: Restart API
Stop the API server (Ctrl+C) and restart:
```bash
pnpm -C apps/api dev
```

### Step 4: Test
1. Create a new session in the app
2. Generate audio
3. Play it - you should hear real TTS!

**Cost**: ~$15 per 1M characters (very cheap for testing)

---

## Option 2: Use Setup Script (Interactive)

```bash
bun apps/api/scripts/setup-tts.ts
```

This will guide you through the setup interactively.

---

## Verify It's Working

After configuring, check API logs when generating audio:
- ✅ `[TTS] openai generating...` = Working!
- ❌ `[TTS] openai failed, falling back to beep` = Check API key

Or run verification:
```bash
bun apps/api/scripts/verify-tts.ts
```

---

## Troubleshooting

**Still hearing beeps?**
1. Check `.env` file has the keys
2. Restart API server (important!)
3. Check API logs for errors
4. Verify API key is valid

**API Key Invalid?**
- Make sure it starts with `sk-`
- Check you copied the full key
- Verify account has credits

---

## Next Steps After TTS Works

Once you have real audio:
1. ✅ Test pre-roll feature (should hear atmosphere before TTS)
2. ✅ Test session switching
3. ✅ Complete testing checklist
4. ✅ Fine-tune voice settings if needed
