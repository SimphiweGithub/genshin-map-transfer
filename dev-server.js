const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 3456;
const BASE = path.join(__dirname, 'Genshin  vercel');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.wav':  'audio/wav',
};

http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ retcode: -1, message: 'API not available in local dev — deploy to Vercel to test live data.' }));
    return;
  }

  const filePath = path.join(BASE, req.url === '/' ? 'index.html' : req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`Dev server running on http://localhost:${PORT}`));
