const { getDefaultConfig } = require('expo/metro-config');
const https = require('https');

const config = getDefaultConfig(__dirname);

// Proxy /api/* to Railway in web dev — same-origin so no CORS.
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url?.startsWith('/api/')) {
        const forwardHeaders = { ...req.headers };
        forwardHeaders['host'] = 'tokoss-production.up.railway.app';
        // Strip origin so Railway doesn't apply its own CORS check
        delete forwardHeaders['origin'];

        const options = {
          hostname: 'tokoss-production.up.railway.app',
          port: 443,
          path: req.url,
          method: req.method,
          headers: forwardHeaders,
        };

        const proxy = https.request(options, (proxyRes) => {
          // Strip Railway's CORS headers — browser won't see cross-origin response
          const headers = {};
          for (const [k, v] of Object.entries(proxyRes.headers)) {
            if (!k.startsWith('access-control-')) headers[k] = v;
          }
          res.writeHead(proxyRes.statusCode, headers);
          proxyRes.pipe(res, { end: true });
        });

        proxy.on('error', (err) => {
          console.error('[proxy] Railway unreachable:', err.message);
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Railway API unreachable' }));
          }
        });

        req.pipe(proxy, { end: true });
      } else {
        middleware(req, res, next);
      }
    };
  },
};

module.exports = config;
