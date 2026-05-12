#!/usr/bin/env node
/**
 * Dev CORS proxy — forwards localhost:3001 → Railway prod API.
 * No deps, no DATABASE_URL needed. Just: node scripts/dev-proxy.js
 */
const http = require('http');
const https = require('https');

const TARGET_HOST = 'tokoss-production.up.railway.app';
const PORT = 3001;

const server = http.createServer((req, res) => {
  const allowed = ['http://localhost:8081', 'http://localhost:3000'];

  res.setHeader('Access-Control-Allow-Origin', allowed.includes(req.headers.origin) ? req.headers.origin : allowed[0]);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const options = {
    hostname: TARGET_HOST,
    port: 443,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: TARGET_HOST,
    },
  };

  const proxy = https.request(options, (proxyRes) => {
    // Strip CORS headers from Railway — we set our own above
    const headers = { ...proxyRes.headers };
    delete headers['access-control-allow-origin'];
    delete headers['access-control-allow-credentials'];
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res, { end: true });
  });

  proxy.on('error', (err) => {
    console.error('[proxy] Railway unreachable:', err.message);
    res.writeHead(502);
    res.end(JSON.stringify({ error: 'Railway API unreachable', detail: err.message }));
  });

  req.pipe(proxy, { end: true });
});

server.listen(PORT, () => {
  console.log(`\n  Karysm dev proxy running`);
  console.log(`  localhost:${PORT} → https://${TARGET_HOST}`);
  console.log(`  Open: http://localhost:8081/dev-login\n`);
});
