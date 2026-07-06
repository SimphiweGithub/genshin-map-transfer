/**
 * AppSample → HoYoLAB Interactive Map Transfer Script
 *
 * Transfers collected chest/collectible progress from AppSample
 * (genshin-impact-map.appsample.com) to the official HoYoLAB
 * interactive map (act.hoyolab.com).
 *
 * HOW TO USE:
 *  1. Log in to HoYoLAB and open the Genshin interactive map:
 *     https://act.hoyolab.com/ys/app/interactive-map/index.html
 *  2. Open DevTools → Console (F12)
 *  3. Paste this entire script and press Enter
 *  4. Watch the progress logs — takes ~2 min per 1000 items
 *
 * WHAT TRANSFERS:
 *  - Common / Exquisite / Precious / Luxurious / Remarkable Chests
 *  - Puzzle Chests (if tracked in AppSample)
 *  - Crimson Agate
 *
 * WHAT DOES NOT TRANSFER (HoYoLAB has no markers for these):
 *  - Shrines of Depths (any region)
 *  - Warming Seelie
 *  - Lumenspar
 *  - Time Trial Challenges
 *  - All Oculi types (these auto-sync via your HoYoLAB account anyway)
 *
 * COORDINATE CONVERSION:
 *  AppSample uses normalised [0,1] coordinates; HoYoLAB uses a
 *  pixel-space coordinate system. Conversion formula derived from
 *  Adrien5902's open-source work (github.com/Adrien5902/genshin-map).
 *
 * RATE LIMIT: 120 ms between mark requests to avoid API bans.
 */

(async () => {
  // AppSample label number → { h: HoYoLAB label id, cat: API fetch category }
  const LABEL_MAP = {
    17:  { h: 17,  cat: 13  },  // Common Chest
    44:  { h: 44,  cat: 13  },  // Exquisite Chest
    45:  { h: 45,  cat: 13  },  // Precious Chest
    46:  { h: 46,  cat: 13  },  // Luxurious Chest
    269: { h: 269, cat: 13  },  // Remarkable Chest
    186: { h: 186, cat: 186 },  // Puzzle Chest
    141: { h: 141, cat: 4   },  // Crimson Agate
  };

  const TRANSFER = new Set(Object.keys(LABEL_MAP).map(k => 'o' + k));

  // AppSample normalised (x,y) → HoYoLAB coordinate space
  const toHoyo = (x, y) => [
    (x - 0.33314565158651044) /  0.00008581802238050456,
    (y - 0.19941397307989506) / -0.00008584331336280794,
  ];

  // ── Step 1: fetch AppSample cloud data ──────────────────────────────────
  console.log('1/4  Fetching AppSample data...');
  const [mData, prog] = await Promise.all([
    fetch('https://game-data.lemonapi.com/gim/markers_all.v5.json?ver=2621f2af6f2f8ad548fdad1d814c591d5204dc71').then(r => r.json()),
    fetch('https://game-data.lemonapi.com/gim/collect_progress.v1.json').then(r => r.json()),
  ]);

  // Build id → position lookup for transferable labels
  const lookup = {};
  for (const m of mData.data) {
    if (TRANSFER.has(m[1])) lookup[m[0]] = { x: m[4], y: m[5], label: +m[1].slice(1) };
  }

  // Collect items the user has found that we can transfer
  const toMark = [];
  for (const [lbl, ids] of Object.entries(prog)) {
    if (!TRANSFER.has(lbl)) continue;
    const map = LABEL_MAP[+lbl.slice(1)];
    if (!map) continue;
    for (const id of ids) {
      const m = lookup[id];
      if (!m) continue;
      const [hx, hy] = toHoyo(m.x, m.y);
      toMark.push({ hx, hy, hLabel: map.h, cat: map.cat });
    }
  }
  console.log(`   Found ${toMark.length} AppSample items to match`);

  // ── Step 2: fetch HoYoLAB point database ────────────────────────────────
  console.log('2/4  Fetching HoYoLAB marker database...');
  const byLabel = {};
  const cats = [...new Set(toMark.map(m => m.cat))];
  for (const cat of cats) {
    const d = await fetch(
      `https://sg-public-api-static.hoyolab.com/common/map_user/ys_obc/v3/map/point/list?map_id=2&label_ids=${cat}&app_sn=ys_obc&lang=en-us`,
      { headers: { 'x-rpc-map_version': '4.5' } }
    ).then(r => r.json());
    for (const p of d.data.point_list) {
      if (p.display_state !== 1) continue; // approved markers only
      if (!byLabel[p.label_id]) byLabel[p.label_id] = [];
      byLabel[p.label_id].push(p);
    }
    console.log(`   category ${cat}: ${d.data.point_list.length} markers`);
  }

  // ── Step 3: coordinate-match AppSample items → HoYoLAB point ids ────────
  console.log('3/4  Matching coordinates (tolerance = 80 units)...');
  const TOLERANCE_SQ = 80 * 80;
  const seen = new Set();
  const pointIds = [];
  let noMatch = 0;

  for (const item of toMark) {
    const cands = byLabel[item.hLabel] ?? [];
    let best = null, bd = Infinity;
    for (const p of cands) {
      const d = (p.x_pos - item.hx) ** 2 + (p.y_pos - item.hy) ** 2;
      if (d < bd) { bd = d; best = p; }
    }
    if (best && bd < TOLERANCE_SQ && !seen.has(best.id)) {
      seen.add(best.id);
      pointIds.push(best.id);
    } else {
      noMatch++;
    }
  }
  console.log(`   Matched: ${pointIds.length}  |  No HoYoLAB marker: ${noMatch}`);

  if (!pointIds.length) { console.log('Nothing to mark.'); return; }

  // ── Step 4: mark on HoYoLAB ─────────────────────────────────────────────
  console.log(`4/4  Marking ${pointIds.length} points on HoYoLAB (120 ms/request)...`);
  let done = 0, errs = 0;

  for (const point_id of pointIds) {
    await new Promise(r => setTimeout(r, 120));
    try {
      const resp = await fetch(
        'https://sg-public-api.hoyolab.com/common/map_user/ys_obc/v1/map/point/add_mark_map_point',
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'x-rpc-map_version': '4.5' },
          body: JSON.stringify({ map_id: 2, point_id, app_sn: 'ys_obc', lang: 'en-us' }),
        }
      ).then(r => r.json());

      if (resp.retcode === 0) done++;
      else { errs++; if (errs <= 5) console.warn(`   retcode ${resp.retcode} for point ${point_id}: ${resp.message}`); }
    } catch (e) { errs++; }

    if ((done + errs) % 50 === 0)
      console.log(`   ${done + errs}/${pointIds.length} processed — ${done} marked`);
  }

  console.log(`✓ Done!  Marked: ${done}  |  Errors / already-marked: ${errs}`);
})();
