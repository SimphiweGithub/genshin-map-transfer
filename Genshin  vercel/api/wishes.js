// Proxy for HoYoverse gacha log API — one page (20 wishes) per call.
// The browser CANNOT call this API directly: the gacha endpoint sends no
// Access-Control-Allow-Origin header, so a direct fetch is blocked by CORS.
// This proxy runs server-side (no CORS) and forwards to the LIVE endpoint.
// NOTE: the old hk4e-api-os.hoyoverse.com host is dead (hangs -> 504). The
// current working host is public-operation-hk4e-sg.hoyoverse.com.
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  let { authkey, gacha_type, end_id, game_biz, lang, region,
        authkey_ver, sign_type, auth_appid } = req.query;

  if (!authkey || !gacha_type) {
    return res.status(400).json({ retcode: -1, message: 'authkey and gacha_type are required' });
  }

  // The authkey from the frontend may be double-encoded — decode once so
  // URLSearchParams can re-encode it cleanly.
  try { authkey = decodeURIComponent(authkey); } catch (_) { /* leave as-is */ }

  const biz = game_biz || 'hk4e_global';
  const isCN = biz === 'hk4e_cn' || biz.startsWith('cn_');

  // Live hosts (2024+). Old *-api-os.hoyoverse.com hosts are dead.
  const host = isCN
    ? 'public-operation-hk4e.mihoyo.com'
    : 'public-operation-hk4e-sg.hoyoverse.com';

  // Whitelist ONLY the params the gacha API expects. The pasted webview URL
  // also carries junk (win_mode, no_joypad_d, plat_type, ...) that makes the
  // backend hang, so we must not forward those.
  const qs = new URLSearchParams({
    authkey_ver: authkey_ver || '1',
    sign_type:   sign_type   || '2',
    auth_appid:  auth_appid  || 'webview_gacha',
    init_type:   gacha_type,
    gacha_type,
    page:        '1',
    size:        '20',
    end_id:      end_id || '0',
    lang:        lang   || 'en',
    game_biz:    biz,
    authkey,
  });
  if (region) qs.set('region', region);

  const url = `https://${host}/gacha_info/api/getGachaLog?${qs}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const upstream = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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
        ? 'HoYoverse API timed out — the authkey may be expired. Get a fresh URL from the game.'
        : `Proxy error: ${err.message}`
    });
  }
};
