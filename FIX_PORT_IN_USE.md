# Fix "Port 8787 in Use" Error

## Quick Fix

The error means the API server is already running in another terminal. You have two options:

### Option 1: Stop the Existing Server (Recommended)

1. **Find the terminal** where you started the API server (`pnpm -C apps/api dev`)
2. **Press `Ctrl+C`** to stop it
3. **Restart** the API server

### Option 2: Kill the Process

If you can't find the terminal, kill the process:

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

### Option 3: Use a Different Port

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

