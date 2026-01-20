# How to Bypass ngrok Browser Warning Page

## 🚨 The Problem

When using ngrok free tier, it displays an interstitial warning page that looks like this:

```
ngrok
You are about to visit: abc123.ngrok-free.app

This is served by a free ngrok tunnel.
ngrok is a tool for developers to expose their local server to the internet.

[Visit Site]
```

**This breaks API requests** because instead of receiving JSON data, your app receives HTML content, causing errors like:

```
SyntaxError: JSON.parse: unexpected character at line 1 column 1 of the JSON data
```

---

## ✅ The Solution

Add the `ngrok-skip-browser-warning` header to all HTTP requests. This tells ngrok to skip the warning page and return the actual response.

---

## 🔧 Implementation for Supabase Client

In your `App.tsx` (or wherever you create the Supabase client):

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client with ngrok bypass header
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: {
    headers: {
      'ngrok-skip-browser-warning': 'true'
    }
  }
});
```

---

## 🔧 Implementation for Fetch API

If you're using fetch directly:

```typescript
const response = await fetch('https://your-tunnel.ngrok-free.app/api/endpoint', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'  // Add this header
  }
});
```

---

## 🔧 Implementation for Axios

If you're using Axios:

```typescript
import axios from 'axios';

// Option 1: Per request
const response = await axios.get('https://your-tunnel.ngrok-free.app/api/endpoint', {
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
});

// Option 2: Global default
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
```

---

## 🔧 Implementation for React Query / TanStack Query

```typescript
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const response = await fetch(queryKey[0] as string, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        return response.json();
      }
    }
  }
});
```

---

## 🔧 Implementation for Angular HttpClient

```typescript
import { HttpHeaders } from '@angular/common/http';

const headers = new HttpHeaders({
  'ngrok-skip-browser-warning': 'true'
});

this.http.get('https://your-tunnel.ngrok-free.app/api/endpoint', { headers });
```

---

## 🔧 Implementation with Interceptor (Any Framework)

Create a global interceptor that adds the header to all requests:

```typescript
// Request interceptor
function addNgrokHeader(config: any) {
  config.headers = config.headers || {};
  config.headers['ngrok-skip-browser-warning'] = 'true';
  return config;
}
```

---

## 📝 Alternative: User-Agent Header

ngrok also checks the User-Agent header. If it looks like a browser, it shows the warning. You can also set a custom User-Agent:

```typescript
headers: {
  'User-Agent': 'MyApp/1.0'  // Non-browser user agent
}
```

However, the `ngrok-skip-browser-warning` header is the official and recommended approach.

---

## ⚠️ Important Notes

1. **This only works for programmatic requests** - If a user visits the ngrok URL directly in their browser, they'll still see the warning page.

2. **The header value can be anything** - `'true'`, `'1'`, `'skip'`, or any non-empty string works.

3. **Works with ngrok free tier** - No paid subscription required.

4. **Must be sent with every request** - The header must be included in each HTTP request.

---

## 🧪 Testing the Fix

### Before (Error):
```javascript
fetch('https://abc123.ngrok-free.app/api/data')
  .then(r => r.json())  // Fails - receives HTML warning page
  .catch(e => console.error(e));  
// Error: SyntaxError: JSON.parse unexpected character
```

### After (Works):
```javascript
fetch('https://abc123.ngrok-free.app/api/data', {
  headers: { 'ngrok-skip-browser-warning': 'true' }
})
  .then(r => r.json())  // Works - receives actual JSON
  .then(data => console.log(data));
// Success: { your: "data" }
```

---

## 🔗 Official Documentation

- ngrok Documentation: https://ngrok.com/docs
- ngrok Free Tier Limitations: https://ngrok.com/docs/guides/limits/

---

## 💡 Pro Tip: Avoid This Issue Entirely

**Upgrade to ngrok paid plan** - Paid plans don't show the browser warning page.

**Use Supabase Cloud** - For production, use https://supabase.com instead of local Docker. It's free and doesn't require tunneling.

---

## 📅 Last Updated
January 20, 2026
