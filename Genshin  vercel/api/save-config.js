module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

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
