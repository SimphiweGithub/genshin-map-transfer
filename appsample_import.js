/**
 * HoYoLAB → AppSample Import Script  (Step 2 of 2)
 *
 * HOW TO USE:
 *  1. Run hoyo_export.js on the HoYoLAB map first — it copies JSON to your clipboard
 *  2. Open the AppSample Genshin map: https://genshin-impact-map.appsample.com/
 *  3. Make sure you are logged in to AppSample (so changes save to the cloud)
 *  4. Open DevTools → Console (F12)
 *  5. Replace `null` below with the JSON you copied, then paste the whole script and hit Enter
 *
 * EXAMPLE:
 *  const HOYO_DATA = [{"hx":1234.5,"hy":6789.0,"hLabel":17}, ...];
 */

const HOYO_DATA = null; // <── REPLACE null WITH YOUR PASTED JSON FROM hoyo_export.js

// ────────────────────────────────────────────────────────────────────────────

(async () => {
  if (!HOYO_DATA || !HOYO_DATA.length) {
    console.error('HOYO_DATA is empty. Paste the JSON from hoyo_export.js in place of null at the top.');
    return;
  }

  // HoYoLAB label → AppSample label(s) to match against
  // Most are 1:1; warming seelie exists as both 18 and 148 in AppSample
  const H_TO_AS = {
    17:  [17],       // Common Chest
    44:  [44],       // Exquisite Chest
    45:  [45],       // Precious Chest
    46:  [46],       // Luxurious Chest
    269: [269],      // Remarkable Chest
    186: [186],      // Puzzle Chest
    8:   [8],        // Mondstadt Shrine of Depths
    9:   [9],        // Liyue Shrine of Depths
    148: [18, 148],  // Warming Seelie (AppSample uses label 18 primarily)
    64:  [64],       // Time Trial Challenge
    212: [212],      // Inazuma Shrine of Depths
    411: [411],      // Sumeru Shrine of Depths
    509: [509],      // Fontaine Shrine of Depths
    577: [577],      // Natlan Shrines of Depths
    703: [703],      // Borderland Shrine of Depths
    141: [141],      // Crimson Agate
  };

  // Reverse coordinate conversion: HoYoLAB pixel-space → AppSample normalised [0,1]
  const toAS = (hx, hy) => [
    hx *  0.00008581802238050456 + 0.33314565158651044,
    hy * -0.00008584331336280794 + 0.19941397307989506,
  ];

  // Equivalent of 80 HoYoLAB units expressed in AppSample coordinate space
  const TOLERANCE_SQ = (80 * 0.00008583) ** 2;

  // ── Step 1: fetch AppSample marker database ────────────────────────────
  console.log('1/3  Fetching AppSample marker database...');
  const mData = await fetch(
    'https://game-data.lemonapi.com/gim/markers_all.v5.json?ver=2621f2af6f2f8ad548fdad1d814c591d5204dc71'
  ).then(r => r.json());

  const TARGET_AS_LABELS = new Set(Object.values(H_TO_AS).flat());
  const asLookup = {}; // label → [{id, x, y}]
  for (const m of mData.data) {
    const lbl = +m[1].slice(1);
    if (!TARGET_AS_LABELS.has(lbl)) continue;
    (asLookup[lbl] ??= []).push({ id: m[0], x: m[4], y: m[5] });
  }
  console.log(`   Loaded AppSample markers for ${Object.keys(asLookup).length} label(s)`);

  // ── Step 2: nearest-neighbour coordinate match ─────────────────────────
  console.log('2/3  Matching coordinates (tolerance = 80 HoYoLAB units)...');
  const seen = new Set();
  const toMark = [];
  let noMatch = 0;

  for (const { hx, hy, hLabel } of HOYO_DATA) {
    const [ax, ay] = toAS(hx, hy);
    const asLabels = H_TO_AS[hLabel] ?? [];
    let best = null, bd = Infinity;

    for (const lbl of asLabels) {
      for (const m of (asLookup[lbl] ?? [])) {
        const d = (m.x - ax) ** 2 + (m.y - ay) ** 2;
        if (d < bd) { bd = d; best = { ...m, label: lbl }; }
      }
    }

    if (best && bd < TOLERANCE_SQ && !seen.has(best.id)) {
      seen.add(best.id);
      toMark.push(best);
    } else {
      noMatch++;
    }
  }
  console.log(`   Matched: ${toMark.length}  |  No AppSample marker: ${noMatch}`);

  if (!toMark.length) { console.log('Nothing to mark.'); return; }

  // ── Step 3: mark on AppSample ──────────────────────────────────────────
  if (typeof window._markAsFound !== 'function') {
    console.error('window._markAsFound not found — make sure you are on the AppSample map page.');
    return;
  }

  console.log(`3/3  Marking ${toMark.length} items on AppSample...`);
  let done = 0;
  for (const { id, label } of toMark) {
    window._markAsFound(`${id}`, `o${label}`);
    done++;
    if (done % 50 === 0) console.log(`   ${done}/${toMark.length} marked`);
    await new Promise(r => setTimeout(r, 20)); // let the UI breathe
  }

  console.log(`✓ Done!  Marked: ${done} items on AppSample.`);
  console.log('  Reload the page if markers are not showing immediately.');
})();
