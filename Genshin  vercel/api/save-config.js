const ALLOWED_ORIGINS = [
  'https://teyvat-chrono.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // Block cross-origin requests from unknown origins
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) {
    return res.status(500).json({ error: 'KV store not configured' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (_) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { uid, server, ltoken, ltuid, discordWebhook } = body || {};
  if (!uid || !ltoken || !ltuid) {
    return res.status(400).json({ error: 'uid, ltoken, and ltuid are required' });
  }

  // Input validation — reject obviously malformed values before writing to KV
  if (!/^\d{6,12}$/.test(uid)) {
    return res.status(400).json({ error: 'Invalid uid format' });
  }
  if (!/^\d{1,20}$/.test(ltuid)) {
    return res.status(400).json({ error: 'Invalid ltuid format' });
  }
  if (!/^[a-zA-Z0-9_\-.]{20,2000}$/.test(ltoken)) {
    return res.status(400).json({ error: 'Invalid ltoken format' });
  }
  const validServers = ['os_usa', 'os_euro', 'os_asia', 'os_cht', 'cn_gf01', 'cn_qd01'];
  if (server && !validServers.includes(server)) {
    return res.status(400).json({ error: 'Invalid server value' });
  }
  if (discordWebhook && !/^https:\/\/discord\.com\/api\/webhooks\//.test(discordWebhook)) {
    return res.status(400).json({ error: 'Invalid discordWebhook URL' });
  }

  const config = {
    uid,
    server: server || 'os_euro',
    ltoken,
    ltuid,
    discordWebhook: discordWebhook || process.env.DISCORD_WEBHOOK_URL || '',
    updatedAt: new Date().toISOString()
  };

  try {
    const r = await fetch(kvUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['SET', 'teyvat_config', JSON.stringify(config)])
    });
    const data = await r.json();
    if (data.result === 'OK') {
      return res.status(200).json({ ok: true, message: 'Config synced to server' });
    }
    return res.status(500).json({ error: 'KV write failed', detail: data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
