const crypto = require('crypto');

// Helper to generate the Dynamic Secret (DS) header required by HoYoLAB APIs
function generateDS(salt = '6s25p5ox5y14umn1p61aqyyvbvvl3lrt') {
  const t = Math.floor(Date.now() / 1000);
  const r = Math.random().toString(36).substring(2, 8); // 6-character random string
  const text = `salt=${salt}&t=${t}&r=${r}`;
  const sign = crypto.createHash('md5').update(text).digest('hex');
  return `${t},${r},${sign}`;
}

// Helper to generate DS with body and query (sometimes required for newer endpoints)
function generateDS2(salt = '6s25p5ox5y14umn1p61aqyyvbvvl3lrt', body = '', query = '') {
  const t = Math.floor(Date.now() / 1000);
  const r = Math.random().toString(36).substring(2, 8);
  const text = `salt=${salt}&t=${t}&r=${r}&b=${body}&q=${query}`;
  const sign = crypto.createHash('md5').update(text).digest('hex');
  return `${t},${r},${sign}`;
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Accept POST body (credentials not exposed in URL logs) or GET query (legacy)
  const params = req.method === 'POST'
    ? (typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}))
    : req.query;
  const { action, uid, server, ltoken, ltuid, schedule_type, character_id, character_ids } = params;

  if (!action) {
    return res.status(400).json({ retcode: -1, message: 'Missing parameter: action is required' });
  }

  // Check-in check status endpoints don't strictly require uid/server, but battle chronicle endpoints do
  if (['dailyNote', 'index', 'spiralAbyss', 'ysLedger', 'characterDetail'].includes(action) && (!uid || !server)) {
    return res.status(400).json({ retcode: -1, message: 'Missing parameter: uid and server are required' });
  }

  if (!ltoken || !ltuid) {
    return res.status(400).json({ retcode: -1, message: 'Missing credentials: ltoken and ltuid cookies are required' });
  }

  // Setup common headers for HoYoLAB Battle Chronicle requests
  const commonHeaders = {
    'Cookie': `ltoken_v2=${ltoken}; ltuid_v2=${ltuid}; ltoken=${ltoken}; ltuid=${ltuid};`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://act.hoyolab.com/',
    'Accept-Language': 'en-us',
    'x-rpc-app_version': '2.34.1',
    'x-rpc-client_type': '4',
    'x-rpc-language': 'en-us'
  };

  try {
    let url = '';
    let method = 'GET';
    let headers = { ...commonHeaders };
    let body = null;

    // Route requests based on action
    switch (action) {
      case 'dailyNote':
        url = `https://bbs-api-os.hoyolab.com/game_record/genshin/api/dailyNote?role_id=${uid}&server=${server}&lang=en-us`;
        headers['DS'] = generateDS();
        break;

      case 'index':
        url = `https://bbs-api-os.hoyolab.com/game_record/genshin/api/index?role_id=${uid}&server=${server}&lang=en-us`;
        headers['DS'] = generateDS();
        break;

      case 'characterDetail': {
        url = `https://bbs-api-os.hoyolab.com/game_record/genshin/api/character/detail`;
        method = 'POST';
        headers['Content-Type'] = 'application/json';
        const ids = character_ids
          ? character_ids.split(',').map(Number)
          : [parseInt(character_id)];
        const cdBody = JSON.stringify({
          character_ids: ids,
          role_id: uid,
          server
        });
        body = cdBody;
        headers['DS'] = generateDS2('6s25p5ox5y14umn1p61aqyyvbvvl3lrt', cdBody, '');
        break;
      }

      case 'spiralAbyss':
        const sched = schedule_type || '1';
        url = `https://bbs-api-os.hoyolab.com/game_record/genshin/api/spiralAbyss?role_id=${uid}&server=${server}&schedule_type=${sched}&lang=en-us`;
        headers['DS'] = generateDS();
        break;

      case 'ysLedger':
        // Modern Traveler's Diary endpoint. Old hk4e-api-os.hoyoverse.com host
        // is dead (hangs -> 504); use ysledgeros on sg-hk4e-api.hoyolab.com.
        url = `https://sg-hk4e-api.hoyolab.com/event/ysledgeros/month_info?month=0&uid=${uid}&region=${server}&lang=en-us`;
        headers['DS'] = generateDS();
        break;

      case 'dailyCheckIn':
        // Check check-in status
        url = `https://sg-hk4e-api.hoyolab.com/event/sol/info?act_id=e202102251931481&lang=en-us`;
        break;

      case 'doCheckIn':
        // Execute check-in
        url = `https://sg-hk4e-api.hoyolab.com/event/sol/sign`;
        method = 'POST';
        headers['Content-Type'] = 'application/json';
        
        // Check-in POST requires DS header. The check-in salt is often different or uses standard OS salt
        // Let's sign it using both query and body parameters. Since query is empty and body has act_id.
        const postBodyObj = { act_id: 'e202102251931481' };
        body = JSON.stringify(postBodyObj);
        
        // For check-in, we use the standard OS salt. Some endpoints require DS with body and query.
        // Let's supply the DS header
        headers['DS'] = generateDS2('6s25p5ox5y14umn1p61aqyyvbvvl3lrt', body, '');
        break;

      default:
        return res.status(400).json({ retcode: -1, message: `Invalid action: ${action}` });
    }

    const fetchOptions = {
      method,
      headers
    };

    if (body) {
      fetchOptions.body = body;
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        retcode: -response.status,
        message: `HTTP error from HoYoLAB: ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      retcode: -500,
      message: `Failed to proxy request to HoYoLAB: ${error.message}`
    });
  }
};
