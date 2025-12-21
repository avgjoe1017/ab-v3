# API Keys Summary - Quick Reference

## ✅ Required for Core Functionality (MVP)

### 1. OpenAI API Key
- **Purpose**: Generate personalized affirmations
- **Status**: ✅ Already integrated
- **Get it**: https://platform.openai.com/api-keys
- **Cost**: ~$0.01-0.02 per 1000 tokens
- **Required**: Yes (or use manual affirmations)

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini  # Optional: gpt-4o, gpt-4.1, gpt-4.1-mini (default)
```

### 2. ElevenLabs API Key (Optional)
- **Purpose**: High-quality text-to-speech
- **Status**: ✅ Already integrated, has fallback
- **Get it**: https://elevenlabs.io/app/settings/api-keys
- **Cost**: Free tier: 10k chars/month
- **Required**: No (falls back to "beep" TTS)

```bash
ELEVENLABS_API_KEY=...
```

---

## 🚀 Required for Production (Phase 6)

### 3. Clerk Authentication
- **Purpose**: User authentication (replaces default user)
- **Status**: ⏳ Code ready, needs SDK installation
- **Get it**: https://clerk.com → Create app → API Keys
- **Cost**: Free tier: 10,000 MAU
- **Required**: For production launch

```bash
# API server (apps/api/.env)
CLERK_SECRET_KEY=sk_test_...

# Mobile app (apps/mobile/.env or app.json extra)
CLERK_PUBLISHABLE_KEY=pk_test_...
```

**Important**: Use `CLERK_PUBLISHABLE_KEY` (NOT `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - that's Next.js only)

**Install**: `pnpm -C apps/api add @clerk/backend`

---

### 4. RevenueCat
- **Purpose**: Subscription management (Pro tier)
- **Status**: ⏳ Code ready
- **Get it**: https://app.revenuecat.com → Project Settings
- **Cost**: Free until $10k MRR
- **Required**: For paid subscriptions

```bash
REVENUECAT_API_KEY=...
```

**Install**: `pnpm -C apps/mobile add react-native-purchases`

---

### 5. AWS S3 + CloudFront
- **Purpose**: Cloud storage for audio files
- **Status**: ⏳ Code ready, needs SDK installation
- **Get it**: AWS Console → IAM → Create user → S3 access
- **Cost**: ~$5-20/month (depending on usage)
- **Required**: For production audio storage

```bash
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=entrain-audio-prod
AWS_REGION=us-east-1
CLOUDFRONT_DOMAIN=d1234abcdef.cloudfront.net  # Optional
```

**Install**: `pnpm -C apps/api add @aws-sdk/client-s3`

---

### 6. Postgres Database
- **Purpose**: Production database (replaces SQLite)
- **Status**: ⏳ Migration script ready
- **Options**: Supabase (free: 500MB) or Neon (free: 0.5GB)
- **Cost**: Free tier available, then ~$25+/month
- **Required**: For production database

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```

---

## 📋 Setup Checklist

### For Development (Works Now):
- [x] OpenAI API Key (for affirmations)
- [ ] ElevenLabs API Key (optional, has fallback)

### For Production:
- [ ] Clerk Secret Key + Publishable Key
- [ ] Postgres Database URL
- [ ] AWS S3 Credentials
- [ ] RevenueCat API Key
- [ ] CloudFront Domain (optional but recommended)

---

## 💰 Estimated Monthly Costs

| Service | Free Tier | Paid (Estimate) |
|---------|-----------|-----------------|
| OpenAI | - | $10-50 |
| ElevenLabs | 10k chars | $5-20 |
| Clerk | 10k MAU | $25+ |
| RevenueCat | $0-10k MRR | Free until $10k |
| AWS S3 | - | $5-20 |
| Postgres | 500MB | $25+ |

**Total**: ~$45-115/month (after free tiers)

---

## 🔧 Quick Setup

1. **Create `apps/api/.env`**:
```bash
# Core
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini  # Optional: gpt-4o, gpt-4.1, gpt-4.1-mini
ELEVENLABS_API_KEY=...

# Production (when ready)
CLERK_SECRET_KEY=sk_...
REVENUECAT_API_KEY=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=...
DATABASE_URL=postgresql://...
```

2. **Restart API**: `pnpm -C apps/api dev`

3. **Check status**: API logs will show which services are configured

---

See `API_KEYS_REQUIRED.md` for detailed instructions.

