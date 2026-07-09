const TIER_SCORES = { 'S+': 20, 'S': 14, 'A': 7, 'B': 3, 'C': 1, 'D': 0 };
const CACHE_KEY = 'meta_scrape_v1';
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 h

function parseIcyVeinsTierList(html) {
  const tblStart = html.indexOf('<table class="tier-list">');
  if (tblStart < 0) return null;
  const tblEnd = html.indexOf('</table>', tblStart);
  const tableHtml = html.slice(tblStart, tblEnd + 8);

  // Column order from th[data-column-name]
  const colNames = [];
  const headerRe = /data-column-name="([^"]+)"/g;
  let m;
  while ((m = headerRe.exec(tableHtml)) !== null) colNames.push(m[1]);

  const roles = {};
  colNames.forEach(c => (roles[c] = []));

  // Each <tr> after the header row is one tier
  const rows = tableHtml.split('<tr>');
  for (let ri = 2; ri < rows.length; ri++) {
    const rowHtml = rows[ri];

    const tierM = rowHtml.match(/<td>([A-Z+]+)<\/td>/);
    if (!tierM) continue;
    const tier = tierM[1];
    if (!(tier in TIER_SCORES)) continue;

    // Split row into cells: [0]=tier label, [1..n]=role columns
    const cells = rowHtml.split('</td>');

    colNames.forEach((colName, ci) => {
      const cellHtml = cells[ci + 1] || '';

      // Each character: title="Name" ... genshin_portrait_image ... url(...)
      const entryRe = /title="([^"]+)"[\s\S]*?genshin_portrait_image[^;]*url\(([^)]+)\)/g;
      let em;
      while ((em = entryRe.exec(cellHtml)) !== null) {
        const name = em[1];
        let imgUrl = em[2].trim();
        if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
        roles[colName].push({ name, tier, score: TIER_SCORES[tier] || 0, iconUrl: imgUrl });
      }
    });
  }

  return roles;
}

async function kvGet(kvUrl, kvToken, key) {
  try {
    const r = await fetch(kvUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${kvToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['GET', key])
    });
    const d = await r.json();
    return d.result ? JSON.parse(d.result) : null;
  } catch (_) { return null; }
}

async function kvSet(kvUrl, kvToken, key, value) {
  try {
    await fetch(kvUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${kvToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['SET', key, JSON.stringify(value)])
    });
  } catch (_) {}
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  // KV cache hit
  if (kvUrl && kvToken) {
    const cached = await kvGet(kvUrl, kvToken, CACHE_KEY);
    if (cached && cached.ts && Date.now() - cached.ts < CACHE_TTL) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached.data);
    }
  }

  // Live fetch
  try {
    const html = await fetch('https://www.icy-veins.com/genshin-impact/tier-list', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }).then(r => r.text());

    const roles = parseIcyVeinsTierList(html);
    if (!roles || !Object.values(roles).some(arr => arr.length > 0)) {
      return res.status(502).json({ error: 'Tier list parse failed — icy-veins HTML may have changed' });
    }

    const result = { lastUpdated: new Date().toISOString(), source: 'icy-veins.com', roles };

    if (kvUrl && kvToken) await kvSet(kvUrl, kvToken, CACHE_KEY, { ts: Date.now(), data: result });

    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(result);
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
};
