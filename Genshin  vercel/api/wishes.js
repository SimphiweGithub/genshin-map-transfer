// Proxy for HoYoverse gacha log API — one page per call, client handles pagination
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { authkey, gacha_type, end_id, game_biz, lang } = req.query;

  if (!authkey || !gacha_type) {
    return res.status(400).json({ retcode: -1, message: 'authkey and gacha_type are required' });
  }

  const biz  = game_biz || 'hk4e_global';
  const lng  = lang     || 'en';
  const eid  = end_id   || '0';

  // Build HoYoverse gacha log URL
  const qs = new URLSearchParams({
    authkey_ver:  '1',
    sign_type:    '2',
    auth_appid:   'webview_gacha',
    init_type:    gacha_type,
    gacha_type,
    page:         '1',
    size:         '20',
    end_id:       eid,
    authkey,
    lang:         lng,
    game_biz:     biz,
  });

  const url = `https://hk4e-api-os.hoyoverse.com/event/gacha_info/api/getGachaLog?${qs}`;

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        retcode: -upstream.status,
        message: `Upstream error: ${upstream.statusText}`
      });
    }

    const data = await upstream.json();
    // No caching — authkeys are ephemeral
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ retcode: -500, message: err.message });
  }
};
