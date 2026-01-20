# REALTIME-COMS Deployment Guide & Troubleshooting

## 📋 Project Overview

This is a React + Vite + Supabase + Google Gemini AI application that was originally designed to run with a local Docker Supabase instance. This guide documents how to deploy it to Vercel while using a local Supabase.

---

## 🔧 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (Docker - local)
- **AI**: Google Gemini API
- **Hosting**: Vercel
- **Tunnel**: ngrok (to expose local Supabase to internet)

---

## 🔑 Required API Keys & Credentials

### 1. Google Gemini API Key
- Get from: https://ai.google.dev/
- Environment variable: `VITE_GEMINI_API_KEY`

### 2. Supabase Credentials (Docker Local)
```
Project URL:    http://127.0.0.1:54321
Publishable:    sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
Secret:         sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
```

### 3. Vercel Environment Variables
```
VITE_GEMINI_API_KEY     = AIzaSyC1WcMOOHEHnPfCb8stiRZYGurcXEx6kII
VITE_SUPABASE_URL       = https://YOUR_NGROK_URL.ngrok-free.app
VITE_SUPABASE_ANON_KEY  = sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

---

## 🌐 The Core Problem: Local Supabase vs Cloud Deployment

### Why It Works Locally
When you run the app with `npm run dev`, your browser runs on YOUR computer and can access `http://127.0.0.1:54321` (your local Docker Supabase).

### Why It Fails on Vercel
When deployed to Vercel, the app runs in users' browsers worldwide. These browsers try to connect to `http://127.0.0.1:54321`, but that address points to THEIR local machine, not yours. Your Docker Supabase doesn't exist on their machines.

### The Solution
Use **ngrok** to create a secure tunnel that exposes your local Supabase to the internet with a public URL like `https://abc123.ngrok-free.app`.

---

## 🚀 Complete Setup Guide

### Step 1: Start Docker Supabase
```powershell
supabase start
```

You should see:
```
╭──────────────────────────────────────────────────────╮
│ 🌐 APIs                                              │
├────────────────┬─────────────────────────────────────┤
│ Project URL    │ http://127.0.0.1:54321              │
╰────────────────┴─────────────────────────────────────╯
```

### Step 2: Start ngrok Tunnel
```powershell
ngrok http 54321
```

You'll see something like:
```
Forwarding    https://abc123def456.ngrok-free.app -> http://localhost:54321
```

**Copy this URL!** You'll need it for Vercel.

### Step 3: Update Vercel Environment Variable
```powershell
cd "e:\REALTIME\REALTIME-COMS"
vercel env rm VITE_SUPABASE_URL --yes
vercel env add VITE_SUPABASE_URL production
# Enter: https://abc123def456.ngrok-free.app
```

### Step 4: Redeploy to Vercel
```powershell
vercel --prod
```

### Step 5: Keep Everything Running
You must keep these running continuously:
- ✅ Docker Desktop (for Supabase containers)
- ✅ `supabase start` (Supabase services)
- ✅ `ngrok http 54321` (tunnel to internet)

---

## 🔓 Bypassing ngrok Browser Warning Page

### The Problem
ngrok free tier shows an interstitial warning page that users must click through. This breaks API requests because the response is HTML instead of JSON.

### The Solution
Add the `ngrok-skip-browser-warning` header to all requests. This was implemented in `App.tsx`:

```typescript
const [supabase] = useState(() => {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    }
  });
});
```

This header tells ngrok to skip the warning page and return the actual API response.

---

## 🐛 Troubleshooting Guide

### Issue 1: Blank Screen on Vercel
**Symptoms:** The deployed app shows a completely black/blank screen with no errors in console.

**Cause:** The `index.html` was missing the script tag to load the React app.

**Solution:** Added the script tag:
```html
<body>
  <div id="root"></div>
  <script type="module" src="/index.tsx"></script>
</body>
```

---

### Issue 2: CORS Errors
**Symptoms:**
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource
```

**Cause:** The tunnel (ngrok/localtunnel) doesn't return proper CORS headers.

**Solutions Tried:**
1. LocalTunnel - Had CORS issues
2. Cloudflare Tunnel - Installation failed
3. ngrok with `ngrok-skip-browser-warning` header - **WORKED**

---

### Issue 3: JSON Parse Error
**Symptoms:**
```
Connection Error: SyntaxError: JSON.parse: unexpected character at line 1 column 1
```

**Cause:** ngrok is returning its HTML warning page instead of JSON API response.

**Solution:** Add `ngrok-skip-browser-warning: true` header to Supabase client (see above).

---

### Issue 4: ngrok URL Changes on Restart
**Symptoms:** After restarting ngrok, the app stops working.

**Cause:** ngrok free tier generates a new random URL each time you start it.

**Solution:**
1. Note the new ngrok URL
2. Update Vercel environment variable:
   ```powershell
   cd "e:\REALTIME\REALTIME-COMS"
   vercel env rm VITE_SUPABASE_URL --yes
   vercel env add VITE_SUPABASE_URL production
   # Enter new ngrok URL
   vercel --prod
   ```

**Permanent Fix:** Upgrade to ngrok paid plan for a fixed subdomain, OR use Supabase Cloud.

---

### Issue 5: "Your codebase isn't linked to a project on Vercel"
**Symptoms:** Vercel CLI commands fail with linking error.

**Cause:** Running commands from wrong directory.

**Solution:** Always run from project directory:
```powershell
cd "e:\REALTIME\REALTIME-COMS"
vercel env add VITE_SUPABASE_URL production
```

---

## 📁 Project Structure

```
REALTIME-COMS/
├── .env.local              # Local environment variables (git ignored)
├── .env.example            # Template for environment variables
├── .vercel/                # Vercel project configuration
├── App.tsx                 # Main React component
├── index.html              # HTML entry point
├── index.tsx               # React entry point
├── vite.config.ts          # Vite configuration
├── vercel.json             # Vercel deployment settings
├── components/
│   ├── Auth.tsx            # Authentication component
│   ├── Storefront.tsx      # Main store UI
│   └── RealtimeCursors.tsx # Realtime cursor tracking
├── services/
│   └── geminiService.ts    # Google Gemini AI integration
└── types.ts                # TypeScript types
```

---

## 🔄 Key Code Changes Made

### 1. App.tsx - Environment Variables
Changed from hardcoded values to environment variables:
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_...';
```

### 2. App.tsx - ngrok Header
Added header to bypass ngrok warning:
```typescript
createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: {
    headers: {
      'ngrok-skip-browser-warning': 'true'
    }
  }
});
```

### 3. vite.config.ts - Environment Loading
Updated to load VITE_ prefixed variables:
```typescript
const env = loadEnv(mode, '.', 'VITE_');
```

### 4. services/geminiService.ts - Gemini API
Changed to use import.meta.env:
```typescript
const getAI = () => new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
```

### 5. index.html - Script Tag
Added missing script tag to load React app:
```html
<script type="module" src="/index.tsx"></script>
```

---

## 🎯 Quick Commands Reference

### Start Local Development
```powershell
# Terminal 1: Start Supabase
supabase start

# Terminal 2: Start ngrok
ngrok http 54321

# Terminal 3: Start dev server
cd "e:\REALTIME\REALTIME-COMS"
npm run dev
```

### Deploy to Vercel
```powershell
cd "e:\REALTIME\REALTIME-COMS"
git add -A
git commit -m "your message"
git push origin main
vercel --prod
```

### Update Supabase URL on Vercel
```powershell
cd "e:\REALTIME\REALTIME-COMS"
vercel env rm VITE_SUPABASE_URL --yes
vercel env add VITE_SUPABASE_URL production
# Enter new ngrok URL
vercel --prod
```

---

## 🏆 Best Practices for Production

1. **Use Supabase Cloud** - Create a free project at https://supabase.com for reliable production hosting
2. **Use ngrok paid plan** - Get a fixed subdomain so URL never changes
3. **Never commit .env.local** - Keep secrets out of git
4. **Monitor ngrok** - It must stay running for the app to work

---

## 📞 Live URLs

- **Vercel App**: https://realtime-coms.vercel.app
- **GitHub Repo**: https://github.com/tzkusman/REALTIME-COMS
- **Vercel Dashboard**: https://vercel.com/tzkusmans-projects/realtime-coms

---

## 📅 Last Updated
January 20, 2026

## 👤 Author
Configured with assistance from GitHub Copilot
