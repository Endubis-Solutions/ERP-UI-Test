'use strict';

/**
 * Runs the deployed topology locally: static files from `public/` plus the
 * Netlify function behind an `/api/*` rewrite. No Netlify CLI, no deploy.
 * Useful for `APP_URL=http://localhost:3100/ npm run smoke`.
 *
 * Run: npm run preview:fn
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const { handler } = require('../netlify/functions/api');

const PORT = Number(process.env.PORT || 3100);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function sendFile(res, filePath) {
  fs.readFile(filePath, (error, buffer) => {
    if (error) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'content-type': TYPES[path.extname(filePath)] || 'application/octet-stream',
      'cache-control': 'no-cache',
    });
    res.end(buffer);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  const isApi = pathname === '/api' || pathname.startsWith('/api/') || pathname.startsWith('/.netlify/functions/api');

  if (isApi) {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', async () => {
      const body = chunks.length ? Buffer.concat(chunks).toString('utf8') : null;
      const response = await handler({
        httpMethod: req.method,
        path: pathname,
        rawUrl: `http://localhost:${PORT}${req.url}`,
        queryStringParameters: Object.fromEntries(url.searchParams.entries()),
        headers: req.headers,
        body,
        isBase64Encoded: false,
      });
      res.writeHead(response.statusCode, response.headers);
      res.end(response.body);
    });
    return;
  }

  const candidate = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  const resolved = path.resolve(candidate);
  if (resolved.startsWith(path.resolve(PUBLIC_DIR)) && fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
    sendFile(res, resolved);
    return;
  }
  sendFile(res, path.join(PUBLIC_DIR, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Netlify topology preview → http://localhost:${PORT} (static + /api function)`);
});
