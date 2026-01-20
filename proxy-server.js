import http from 'http';
import url from 'url';

const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';
const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Info, apikey');
  res.setHeader('Access-Control-Max-Age', '3600');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse target URL
  const targetUrl = LOCAL_SUPABASE_URL + req.url;
  
  console.log(`Proxying: ${req.method} ${req.url}`);

  const options = {
    hostname: '127.0.0.1',
    port: 54321,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      'host': '127.0.0.1:54321',
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // Copy response headers
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.writeHead(proxyRes.statusCode);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Bad Gateway', 
      message: 'Could not connect to local Supabase',
      details: err.message 
    }));
  });

  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`✅ Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Forwarding to: ${LOCAL_SUPABASE_URL}`);
  console.log(`🌐 Use this URL in your app: http://localhost:${PORT}`);
});
