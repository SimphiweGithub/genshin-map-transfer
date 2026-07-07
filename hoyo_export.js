/**
 * HoYoLAB → AppSample Export Script  (Step 1 of 2)
 *
 * HOW TO USE:
 *  1. Log in to HoYoLAB and open the Genshin interactive map:
 *     https://act.hoyolab.com/ys/app/interactive-map/index.html
 *  2. Open DevTools → Console (F12)
 *  3. Paste this entire script and press Enter
 *  4. When it finishes, your export JSON is in the clipboard
 *  5. Open AppSample map and run appsample_import.js (paste the JSON there)
 *
 * WHAT IT EXPORTS:
 *  - All chests, shrines, warming seelies, time trials, crimson agate
 *    that you have marked as collected on HoYoLAB
 */

(async () => {
  const TARGET_CATS = [13, 186, 4];
  const TARGET_LABELS = new Set([
    17, 44, 45, 46, 269,          // chests
    186, 8, 9, 148, 64,           // puzzle chest, shrines, warming seelie, time trial
    212, 411, 509, 577, 703,      // regional shrines
    141,                          // crimson agate
  ]);

  // ── Step 1: fetch your collected point IDs ──────────────────────────────
  console.log('1/3  Fetching your HoYoLAB collected points...');
  // No custom headers here — x-rpc-map_version triggers a CORS preflight that hangs
  const r = await fetch(
    'https://sg-public-api.hoyolab.com/common/map_user/ys_obc/v1/map/point/mark_map_point_list' +
    '?map_id=2&app_sn=ys_obc&lang=en-us',
    { credentials: 'include' }
  ).then(r => r.json());

  if (r.retcode !== 0) {
    console.error('Auth error — make sure you are logged in to HoYoLAB:', r.message);
    return;
  }
  const marked = r.data.list;
  console.log(`   Found ${marked.length} marked points total`);

  // ── Step 2: fetch HoYoLAB marker positions ──────────────────────────────
  console.log('2/3  Fetching HoYoLAB marker database...');
  const pointLookup = {}; // point_id → { x, y, label_id }
  for (const cat of TARGET_CATS) {
    const d = await fetch(
      `https://sg-public-api-static.hoyolab.com/common/map_user/ys_obc/v3/map/point/list` +
      `?map_id=2&label_ids=${cat}&app_sn=ys_obc&lang=en-us`,
      { headers: { 'x-rpc-map_version': '4.5' } }
    ).then(r => r.json());
    for (const p of d.data.point_list) {
      if (TARGET_LABELS.has(p.label_id)) {
        pointLookup[p.id] = { x: p.x_pos, y: p.y_pos, label_id: p.label_id };
      }
    }
    console.log(`   category ${cat}: ${d.data.point_list.length} markers loaded`);
  }

  // ── Step 3: resolve each collected point to its position ────────────────
  console.log('3/3  Combining data...');
  const exportData = [];
  let unknown = 0;
  for (const m of marked) {
    const p = pointLookup[m.point_id];
    if (p) {
      exportData.push({ hx: p.x, hy: p.y, hLabel: p.label_id });
    } else {
      unknown++;
    }
  }
  console.log(`   Exportable: ${exportData.length}  |  Unknown category (skipped): ${unknown}`);

  window._hoyoExport = exportData;
  copy(JSON.stringify(exportData));
  console.log(`✓ Done!  ${exportData.length} points copied to clipboard.`);
  console.log('  Next: open AppSample map → F12 → Console → run appsample_import.js');
})();
