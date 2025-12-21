# Troubleshooting Guide

## Common Errors

### Port 8787 Already in Use

**Error:**
```
error: Failed to start server. Is port 8787 in use?
code: "EADDRINUSE"
```

**Solution:**
1. Find and stop the process using port 8787:
   ```bash
   # Windows (PowerShell)
   netstat -ano | findstr :8787
   # Then kill the process using the PID shown
   taskkill /PID <PID> /F
   
   # macOS/Linux
   lsof -ti:8787 | xargs kill -9
   ```

2. Or use a different port by setting the `PORT` environment variable:
   ```bash
   # In apps/api/.env
   PORT=8788
   ```

### OPENAI_API_KEY Not Configured

**Error:**
```
ERROR [AIAffirmation] Failed to generate: HTTP 500: 
{"code":"INTERNAL_ERROR","message":"Failed to generate affirmations",
"details":"OPENAI_API_KEY not configured. Add OPENAI_API_KEY to apps/api/.env"}
```

**Solution:**
1. Create `apps/api/.env` file if it doesn't exist
2. Add your OpenAI API key:
   ```bash
   OPENAI_API_KEY=sk-your-key-here
   ```
3. Restart the API server

**Note:** You can get an API key from https://platform.openai.com/api-keys

### API Server Not Running

If the mobile app can't connect to the API:
1. Make sure the API server is running: `pnpm -C apps/api dev`
2. Check the API is accessible at `http://localhost:8787`
3. Verify the mobile app is configured to use the correct API URL

