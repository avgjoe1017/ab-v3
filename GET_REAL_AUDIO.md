# Get Real Audio Now - Quick Setup

You're hearing beeps because TTS isn't configured. Here's how to get real audio in 2 minutes:

## Quick Setup (OpenAI - Recommended)

### 1. Get API Key
- Go to: https://platform.openai.com/api-keys
- Sign in/create account
- Click "Create new secret key"
- Copy the key (starts with `sk-`)

### 2. Add to .env
Edit `apps/api/.env` and add these lines:
```bash
TTS_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-key-here
```

### 3. Restart API Server
**Important**: Stop the API server (Ctrl+C) and restart it:
```bash
pnpm -C apps/api dev
```

### 4. Test
1. Create a NEW session in the app (old sessions still have beeps cached)
2. Generate audio
3. Play it - you should hear real TTS!

## Verify It's Working

Check the API server logs when generating audio. You should see:
- ✅ `[TTS] Using provider: openai`
- ✅ `[TTS] Generating with OpenAI TTS...`
- ✅ `[TTS] ✅ OpenAI TTS generation complete`

If you see:
- ❌ `[TTS] ⚠️  Using beep fallback` = TTS not configured
- ❌ `[TTS] ❌ openai failed` = Check API key

## Cost
OpenAI TTS is very cheap: ~$15 per 1M characters. For testing, you'll use maybe $0.01-0.10.

## Troubleshooting

**Still hearing beeps?**
1. ✅ Check `.env` file has both `TTS_PROVIDER=openai` AND `OPENAI_API_KEY=sk-...`
2. ✅ **Restart API server** (this is critical!)
3. ✅ Create a **new session** (old ones are cached with beeps)
4. ✅ Check API logs for errors

**API Key Issues?**
- Make sure key starts with `sk-`
- Check you copied the full key
- Verify account has credits at https://platform.openai.com/usage

## What's Next?

Once you have real audio:
1. ✅ Test pre-roll feature (atmosphere before TTS)
2. ✅ Test session switching
3. ✅ Complete testing checklist
4. ✅ Fine-tune voice/pace if needed

---

**Need help?** Check `MD_DOCS/TTS_SETUP_GUIDE.md` for detailed instructions.
