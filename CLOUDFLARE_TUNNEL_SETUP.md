# Cloudflare Tunnel Setup Instructions

## Step 1: Download cloudflared
Visit: https://developers.cloudflare.com/cloudflare-one/connections/connect-applications/install-and-setup/installation/
Download the Windows (amd64) executable

## Step 2: Authenticate
Run in PowerShell:
```powershell
cloudflared tunnel login
```
This will open a browser to authenticate with your Cloudflare account.

## Step 3: Create a tunnel
```powershell
cloudflared tunnel create realtime-supabase
```
This will give you a Tunnel ID. Save it.

## Step 4: Create config file
Create a file at: C:\Users\YourUsername\.cloudflared\config.yml
```yaml
tunnel: realtime-supabase
credentials-file: C:\Users\YourUsername\.cloudflared\<tunnel-id>.json

ingress:
  - hostname: supabase.yourdomain.com
    service: http://localhost:54321
  - service: http_status:404
```

Replace:
- `yourdomain.com` with your actual Cloudflare domain
- The tunnel ID with your actual tunnel ID

## Step 5: Run the tunnel
```powershell
cloudflared tunnel run realtime-supabase
```

## Step 6: Get the public URL
The tunnel will show your public URL. Copy it.
Format: https://supabase.yourdomain.com

## Step 7: Update Vercel
Replace VITE_SUPABASE_URL in Vercel with the URL from Step 6

## Step 8: Redeploy
```powershell
vercel --prod
```
