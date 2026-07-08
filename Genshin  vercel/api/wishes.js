// Proxy for HoYoverse gacha log API — one page (20 wishes) per call
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  let { authkey, gacha_type, end_id, game_biz, lang } = req.query;

  if (!authkey || !gacha_type) {
    return res.status(400).json({ retcode: -1, message: 'authkey and gacha_type are required' });
  }

  // The authkey from the frontend page URL may have been double-encoded.
  // Decode once so URLSearchParams can re-encode it cleanly.
  try {
    const decoded = decodeURIComponent(authkey);
    // If it decoded successfully and looks different, use the decoded form
    authkey = decoded;
  } catch (_) { /* leave as-is */ }

  const biz  = game_biz || 'hk4e_global';
  const lng  = lang     || 'en';
  const eid  = end_id   || '0';

  // Choose the right API host: OS global vs China
  const host = biz.includes('cn') || biz === 'hk4e_cn'
    ? 'hk4e-api.mihoyo.com'
    : 'hk4e-api-os.hoyoverse.com';

  const qs = new URLSearchParams({
    authkey_ver: '1',
    sign_type:   '2',
    auth_appid:  'webview_gacha',
    init_type:   gacha_type,
    gacha_type,
    page:        '1',
    size:        '20',
    end_id:      eid,
    authkey,
    lang:        lng,
    game_biz:    biz,
  });

  const url = `https://${host}/event/gacha_info/api/getGachaLog?${qs}`;

  // 25-second abort — well inside Vercel's 30s maxDuration
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const upstream = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://gs.hoyoverse.com/',
        'Accept': 'application/json',
      }
    });
    clearTimeout(timer);

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        retcode: -upstream.status,
        message: `Upstream returned HTTP ${upstream.status} ${upstream.statusText}`
      });
    }

    const data = await upstream.json();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(data);

  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err.name === 'AbortError';
    return res.status(isTimeout ? 504 : 500).json({
      retcode: -1,
      message: isTimeout
        ? 'HoYoverse API timed out — the authkey may be expired or the server is slow. Try again.'
        : `Proxy error: ${err.message}`
    });
  }
};
