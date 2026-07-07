# Genshin Map Transfer

Transfer collected chest and collectible progress between the two Genshin interactive maps
using browser console scripts — no installs required.

| Direction | Script(s) | Where to run |
|---|---|---|
| AppSample → HoYoLAB | `transfer.js` | HoYoLAB map |
| HoYoLAB → AppSample | `hoyo_export.js` then `appsample_import.js` | HoYoLAB map, then AppSample map |

## What transfers

| Item | Transfers? | Notes |
|---|---|---|
| Common Chest | ✅ | |
| Exquisite Chest | ✅ | |
| Precious Chest | ✅ | |
| Luxurious Chest | ✅ | |
| Remarkable Chest | ✅ | |
| Puzzle Chest | ✅ | Only if tracked in AppSample |
| Shrines of Depths | ✅ | All regions except Kuuhenki (not yet on HoYoLAB) |
| Warming Seelie | ✅ | AppSample label 18 remapped to HoYoLAB label 148 |
| Time Trial Challenges | ✅ | |
| Crimson Agate | ✅ | |
| Lumenspar | ❌ | Not mapped on HoYoLAB |
| Kuuhenki Shrine | ❌ | Too new — HoYoLAB hasn't mapped it yet |
| All Oculi | ❌ | Auto-sync via your HoYoLAB account — don't touch |

> **Match rate:** Both databases are community-built independently, so not every
> AppSample position has a corresponding HoYoLAB marker. Expect roughly 10–20%
> of tracked items to match.

## Prerequisites

- Both accounts (AppSample with **Free Cloud Save** enabled, HoYoLAB)
- Comfortable using browser DevTools (F12 → Console)

---

## AppSample → HoYoLAB (`transfer.js`)

1. Log in to HoYoLAB and open the Genshin interactive map:
   ```
   https://act.hoyolab.com/ys/app/interactive-map/index.html
   ```
2. Open DevTools → **Console** tab (`F12`)
3. Copy the entire contents of [`transfer.js`](transfer.js), paste, and press **Enter**
4. Takes roughly **2 minutes per 1 000 items**

### Example output

```
1/4  Fetching AppSample data...
     Found 4907 AppSample items to match
2/4  Fetching HoYoLAB marker database...
     category 13: 3333 markers
     category 186: 4019 markers
     category 4: 1759 markers
3/4  Matching coordinates (tolerance = 80 units)...
     Matched: 709  |  No HoYoLAB marker: 4198
4/4  Marking 709 points on HoYoLAB (120 ms/request)...
     50/709 processed — 50 marked
     ...
✓ Done!  Marked: 709  |  Errors / already-marked: 0
```

---

## HoYoLAB → AppSample (`hoyo_export.js` + `appsample_import.js`)

This is a two-step process because the two maps are on different domains and can't share cookies.

### Step 1 — Export from HoYoLAB

1. Open the HoYoLAB Genshin interactive map (logged in):
   ```
   https://act.hoyolab.com/ys/app/interactive-map/index.html
   ```
2. Open DevTools → **Console** (`F12`)
3. Paste [`hoyo_export.js`](hoyo_export.js) and press **Enter**
4. When it finishes, your collected points are **automatically copied to the clipboard**

### Step 2 — Import to AppSample

1. Open the AppSample map (logged in, so changes save to cloud):
   ```
   https://genshin-impact-map.appsample.com/
   ```
2. Open DevTools → **Console** (`F12`)
3. Open [`appsample_import.js`](appsample_import.js) and replace `null` on line 1 with the JSON from your clipboard:
   ```javascript
   const HOYO_DATA = [{"hx":1234.5,"hy":6789.0,"hLabel":17}, ...]; // ← paste here
   ```
4. Paste the edited script into the console and press **Enter**

---

## How it works

### AppSample → HoYoLAB
1. Fetches your AppSample cloud save from `game-data.lemonapi.com` (no auth needed)
2. Fetches HoYoLAB's marker database from `sg-public-api-static.hoyolab.com` (CDN-cached)
3. Converts coordinates from AppSample's normalised `[0, 1]` space to HoYoLAB pixel-space
4. Nearest-neighbour matches each collected AppSample item to a HoYoLAB marker (80 unit tolerance)
5. Marks each match via `POST /map/point/add_mark_map_point` (rate-limited to 120 ms/request)

### HoYoLAB → AppSample
1. Fetches your HoYoLAB collected point IDs from `/v1/map/point/mark_map_point_list` (auth via cookies)
2. Resolves each point ID to its coordinates via HoYoLAB's static marker database
3. Converts coordinates back to AppSample normalised space (reverse of above formula)
4. Nearest-neighbour matches each position to an AppSample marker (same 80 unit tolerance)
5. Calls `window._markAsFound(id, label)` for each match on the AppSample page

## API endpoints used

| Endpoint | Purpose |
|---|---|
| `game-data.lemonapi.com/gim/markers_all.v5.json` | AppSample marker database |
| `game-data.lemonapi.com/gim/collect_progress.v1.json` | Your AppSample cloud save (AS→Hoyo only) |
| `sg-public-api-static.hoyolab.com/.../v3/map/point/list?label_ids=13` | HoYoLAB chests |
| `sg-public-api-static.hoyolab.com/.../v3/map/point/list?label_ids=186` | HoYoLAB puzzle/shrine/seelie/time-trial |
| `sg-public-api-static.hoyolab.com/.../v3/map/point/list?label_ids=4` | HoYoLAB special items (crimson agate) |
| `sg-public-api.hoyolab.com/.../v1/map/point/add_mark_map_point` | Mark a point collected on HoYoLAB |
| `sg-public-api.hoyolab.com/.../v1/map/point/mark_map_point_list` | Your HoYoLAB collected points (Hoyo→AS only) |

## Limitations

- HoYoLAB's marker database is community-contributed and not exhaustive — expect ~10–20% of items to find no match
- Running either script a second time is safe — HoYoLAB returns a non-zero retcode for already-marked points; AppSample's `_markAsFound` silently skips already-found items
- AppSample's cloud save URL must be publicly accessible (default for Free Cloud Save accounts)
- Sub-maps (Chasm underground, Enkanomiya) use separate coordinate spaces — re-run the scripts with those maps open if needed

## License

MIT
