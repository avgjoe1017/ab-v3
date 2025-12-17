# API Keys & Environment Variables Required

**Last Updated**: January 2025  
**Status**: Production Readiness - Phase 6

---

## Required for Core Functionality

### ✅ Currently Working (Development Mode)
These work without API keys using fallbacks:
- **Authentication**: Uses default user ID (no key needed for development)
- **Database**: SQLite (no key needed)
- **Audio Storage**: Local file system (no key needed)

---

## Required for Production Features

### 1. OpenAI API Key
**Purpose**: Generate personalized affirmations  
**Status**: ✅ Already in codebase  
**Where Used**: `apps/api/src/services/affirmation-generator.ts`

**Environment Variable**:
```bash
OPENAI_API_KEY=sk-...
```

**How to Get**:
1. Go to https://platform.openai.com/api-keys
2. Create new API key
3. Copy and add to `.env` file in `apps/api/`

**Cost**: Pay-as-you-go (~$0.01-0.02 per 1000 tokens)  
**Required For**: Phase 1.1 - Affirmation generation

---

### 2. ElevenLabs API Key
**Purpose**: Text-to-speech for affirmations  
**Status**: ✅ Already in codebase  
**Where Used**: `apps/api/src/services/audio/tts.ts`

**Environment Variable**:
```bash
ELEVENLABS_API_KEY=...
```

**How to Get**:
1. Go to https://elevenlabs.io/app/settings/api-keys
2. Create new API key
3. Copy and add to `.env` file

**Cost**: Free tier: 10,000 characters/month, then pay-as-you-go  
**Required For**: Phase 1.2 - TTS audio generation

**Note**: Falls back to "beep" TTS if not configured

---

## Required for Production Deployment (Phase 6)

### 3. Clerk Secret Key
**Purpose**: User authentication  
**Status**: ⏳ Code structure ready, needs SDK installation  
**Where Used**: `apps/api/src/lib/clerk.ts`, `apps/api/src/lib/auth.ts`

**Environment Variables**:
```bash
CLERK_SECRET_KEY=sk_...
CLERK_PUBLISHABLE_KEY=pk_...  # For mobile app
```

**How to Get**:
1. Go to https://clerk.com
2. Create account and application
3. Get Secret Key from Dashboard → API Keys
4. Get Publishable Key for mobile app

**Cost**: Free tier: 10,000 MAU (Monthly Active Users)  
**Required For**: Phase 6.1 - Replace default user authentication

**Installation**:
```bash
# API
pnpm -C apps/api add @clerk/backend

# Mobile app
pnpm -C apps/mobile add @clerk/clerk-expo
```

---

### 4. RevenueCat API Key
**Purpose**: Subscription management  
**Status**: ⏳ Code structure ready  
**Where Used**: `apps/api/src/services/revenuecat.ts`, `apps/api/src/services/entitlements.ts`

**Environment Variable**:
```bash
REVENUECAT_API_KEY=...
```

**How to Get**:
1. Go to https://app.revenuecat.com
2. Create account and project
3. Get API key from Project Settings → API Keys

**Cost**: Free tier: $0-10k MRR  
**Required For**: Phase 6.3 - Pro tier subscriptions

**Installation**:
```bash
# Mobile app
pnpm -C apps/mobile add react-native-purchases
```

---

### 5. AWS Credentials (S3 + CloudFront)
**Purpose**: Cloud storage for audio files  
**Status**: ✅ **Fully Configured & Tested** - S3 connection verified  
**Where Used**: `apps/api/src/services/storage/s3.ts`

**Environment Variables**:
```bash
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=entrain-audio-prod
AWS_REGION=us-east-1
CLOUDFRONT_DOMAIN=d1234abcdef.cloudfront.net  # Optional but recommended
```

**Step-by-Step Setup**:

#### Step 1: Create IAM User (✅ Already Done)
- ✅ Created user: `audiofiles`
- ✅ Attached policy: `AmazonS3FullAccess`

#### Step 2: Create Access Key (✅ Already Done)
- ✅ Access key created and added to `.env` file
- ✅ AWS SDK packages installed (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
- ✅ S3 service code enabled in `apps/api/src/services/storage/s3.ts`

#### Step 3: Create S3 Bucket (✅ Already Done)
- ✅ Bucket created: `ab-v3`
- ✅ Region configured: `us-east-2`
- ✅ S3 connection tested and verified
- ✅ File upload functionality confirmed working
1. In the IAM console, on the "audiofiles" user page
2. Click **"Create access key"** (visible in the Summary section under "Access key 1")
3. Choose **"Application running outside AWS"** as the use case
4. Click **"Next"** and optionally add a description tag
5. Click **"Create access key"**
6. **IMPORTANT**: Copy both:
   - **Access key ID** → This is your `AWS_ACCESS_KEY_ID`
   - **Secret access key** → This is your `AWS_SECRET_ACCESS_KEY` (only shown once!)
7. Store these securely - you won't be able to see the secret key again

#### Step 3: Create S3 Bucket
1. Go to **S3** service in AWS Console
2. Click **"Create bucket"**
3. **Bucket name**: `entrain-audio-prod` (or your preferred name, must be globally unique)
4. **AWS Region**: Choose `us-east-1` (or your preferred region)
5. **Object Ownership**: Keep default (ACLs disabled recommended)
6. **Block Public Access**: 
   - ✅ Uncheck "Block all public access" (needed for CloudFront/CDN access)
   - Acknowledge the warning
7. **Bucket Versioning**: Disable (unless you need versioning)
8. **Default encryption**: Enable (SSE-S3 is fine for most cases)
9. Click **"Create bucket"**

#### Step 4: Configure Bucket for Public Read (CloudFront/CDN)
1. Go to your bucket → **Permissions** tab
2. **Bucket policy**: Add this policy (replace `YOUR-BUCKET-NAME` and `YOUR-ACCOUNT-ID`):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```
3. **CORS configuration** (if needed for web access):
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

#### Step 5: (Optional) Set Up CloudFront Distribution
1. Go to **CloudFront** service
2. Click **"Create distribution"**
3. **Origin domain**: Select your S3 bucket
4. **Name**: Auto-filled from bucket
5. **Viewer protocol policy**: Redirect HTTP to HTTPS
6. **Allowed HTTP methods**: GET, HEAD, OPTIONS
7. **Cache policy**: CachingOptimized (or CachingDisabled for development)
8. Click **"Create distribution"**
9. Wait 5-15 minutes for deployment
10. Copy the **Distribution domain name** (e.g., `d1234abcdef.cloudfront.net`) → This is your `CLOUDFRONT_DOMAIN`

#### Step 6: Install AWS SDK
```bash
pnpm -C apps/api add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

#### Step 7: Add to `.env` file
Add to `apps/api/.env`:
```bash
AWS_ACCESS_KEY_ID=AKIA...  # From Step 2
AWS_SECRET_ACCESS_KEY=...  # From Step 2 (secret key)
AWS_S3_BUCKET_NAME=entrain-audio-prod  # From Step 3
AWS_REGION=us-east-1  # Your chosen region
CLOUDFRONT_DOMAIN=d1234abcdef.cloudfront.net  # From Step 5 (optional)
```

**Cost**: S3: ~$0.023/GB storage, $0.005/1000 requests  
**Required For**: Phase 6.4 - Cloud storage for audio files

---

### 6. Database URL (Postgres)
**Purpose**: Production database (replaces SQLite)  
**Status**: ⏳ Migration script ready  
**Where Used**: Prisma database connection

**Environment Variable**:
```bash
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
```

**Options**:
- **Supabase**: Free tier: 500MB database
- **Neon**: Free tier: 0.5GB storage
- **Railway**: Free tier available
- **Self-hosted**: Any Postgres instance

**How to Get**:
1. Create Supabase/Neon account
2. Create new database
3. Copy connection string
4. Add to `.env` file

**Required For**: Phase 6.2 - Production database

---

## Optional Environment Variables

### TTS Provider Selection
```bash
TTS_PROVIDER=openai|elevenlabs|azure|beep
```
**Default**: `beep` (fallback, no API key needed)

### Azure Speech (Alternative TTS)
```bash
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=...
```
**Required For**: Using Azure TTS instead of ElevenLabs

### CORS Origins (Production)
```bash
ALLOWED_ORIGINS=https://yourapp.com,https://www.yourapp.com
```
**Required For**: Restricting CORS in production

### Port
```bash
PORT=8787
```
**Default**: `8787`

### Node Environment
```bash
NODE_ENV=production|development
```
**Default**: `development`

---

## Priority Order

### For MVP/Development:
1. ✅ **OpenAI API Key** - Required for affirmation generation
2. ✅ **ElevenLabs API Key** - Required for TTS (or use beep fallback)

### For Production Launch:
3. **Clerk Keys** - User authentication
4. **Postgres Database** - Production database
5. **AWS S3** - Cloud storage
6. **RevenueCat** - Subscriptions (can add later)

---

## Setup Instructions

### 1. Create `.env` file in `apps/api/`:
```bash
# Core functionality
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...

# Production (when ready)
CLERK_SECRET_KEY=sk_...
REVENUECAT_API_KEY=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=...
DATABASE_URL=postgresql://...
```

### 2. Create `.env` file in `apps/mobile/` (if needed):
```bash
CLERK_PUBLISHABLE_KEY=pk_...
```

### 3. Restart API server after adding keys:
```bash
pnpm -C apps/api dev
```

---

## Cost Estimates (Monthly)

| Service | Free Tier | Paid Tier (Estimate) |
|---------|-----------|---------------------|
| OpenAI | - | ~$10-50 (depending on usage) |
| ElevenLabs | 10k chars/month | ~$5-20 |
| Clerk | 10k MAU | $25+ after free tier |
| RevenueCat | $0-10k MRR | Free until $10k MRR |
| AWS S3 | - | ~$5-20 (depending on storage) |
| Supabase Postgres | 500MB | $25+ after free tier |

**Total Estimated Monthly Cost**: $45-115+ (depending on usage)

---

## Security Notes

⚠️ **Never commit API keys to git!**

- Add `.env` to `.gitignore`
- Use environment variables in production
- Rotate keys regularly
- Use different keys for development vs production

---

## Testing Without Keys

The app works in development mode without most keys:
- ✅ Default user authentication (no Clerk needed)
- ✅ SQLite database (no Postgres needed)
- ✅ Local file storage (no S3 needed)
- ✅ Beep TTS fallback (no ElevenLabs needed)
- ❌ Affirmation generation requires OpenAI (or manual affirmations)

---

## Next Steps

1. **Get OpenAI key** - Required for core functionality
2. **Get ElevenLabs key** - For better TTS (optional, has fallback)
3. **Test locally** - Verify everything works
4. **Set up production services** - When ready to deploy:
   - Clerk for auth
   - Postgres database
   - AWS S3 for storage
   - RevenueCat for subscriptions

