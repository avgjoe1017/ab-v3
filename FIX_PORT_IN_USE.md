# Fix "Port 8787 in Use" Error

## Quick Fix (Recommended)

### Use the Helper Script

**Option 1: Automatic Startup Script (Best)**
```powershell
# This script automatically kills any process on port 8787 before starting
powershell -ExecutionPolicy Bypass -File apps/api/start-dev.ps1
```

**Option 2: Kill Port Manually**
```powershell
# Run this script to kill any process using port 8787
powershell -ExecutionPolicy Bypass -File apps/api/kill-port.ps1

# Then start the server normally
pnpm -C apps/api dev
```

### Manual Options

**Option 3: Stop the Existing Server**
1. **Find the terminal** where you started the API server (`pnpm -C apps/api dev`)
2. **Press `Ctrl+C`** to stop it
3. **Restart** the API server

**Option 4: Kill the Process Manually**

**PowerShell:**
```powershell
# Find the process using port 8787
$process = Get-NetTCPConnection -LocalPort 8787 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess

# Kill it
if ($process) {
    Stop-Process -Id $process -Force
    Write-Host "Killed process $process"
} else {
    Write-Host "No process found on port 8787"
}
```

**Or manually:**
1. Open Task Manager (`Ctrl+Shift+Esc`)
2. Go to "Details" tab
3. Find "bun.exe" process
4. Right-click → End Task

### Option 5: Use a Different Port

If you want to run multiple instances, change the port:

1. Set environment variable:
   ```powershell
   $env:PORT=8788
   pnpm -C apps/api dev
   ```

2. Or edit `apps/api/src/index.ts` line 262:
   ```typescript
   const port = Number(process.env.PORT ?? 8788); // Changed from 8787
   ```

## After Fixing

Once the port is free, restart the API server:
```bash
pnpm -C apps/api dev
```

You should see:
```
[api] listening on http://localhost:8787
```

