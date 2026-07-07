# Genshin Map Transfer

Transfer your collected chest and collectible progress from **AppSample**
(`genshin-impact-map.appsample.com`) to the **official HoYoLAB interactive map**
(`act.hoyolab.com`), using a single browser console script.

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

- An AppSample account with **Free Cloud Save** enabled (your progress is synced)
- A HoYoLAB account, logged in to the interactive map in your browser
- Comfortable using browser DevTools (F12 → Console)

## Usage

1. Log in to HoYoLAB and open the Genshin interactive map:
   ```
   https://act.hoyolab.com/ys/app/interactive-map/index.html
   ```
2. Open DevTools → **Console** tab (`F12`)
3. Copy the entire contents of [`transfer.js`](transfer.js)
4. Paste into the console and press **Enter**
5. Watch the progress logs — the script takes roughly **2 minutes per 1 000 items**

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

## How it works

1. **Fetches your AppSample cloud progress** from `game-data.lemonapi.com` (CORS-open endpoint, no auth needed)
2. **Fetches HoYoLAB's marker database** from `sg-public-api-static.hoyolab.com` (CDN-cached, no auth needed)
3. **Converts coordinates** from AppSample's normalised `[0, 1]` space to HoYoLAB's pixel-space using the formula from [Adrien5902/genshin-map](https://github.com/Adrien5902)
4. **Nearest-neighbour matches** each AppSample position to a HoYoLAB marker within 80 coordinate units
5. **Marks each matched point** via `POST /map/point/add_mark_map_point` using your HoYoLAB session cookies (rate-limited to 120 ms/request)

## API endpoints used

| Endpoint | Purpose |
|---|---|
| `game-data.lemonapi.com/gim/markers_all.v5.json` | AppSample marker database |
| `game-data.lemonapi.com/gim/collect_progress.v1.json` | Your AppSample cloud save |
| `sg-public-api-static.hoyolab.com/.../v3/map/point/list?label_ids=13` | HoYoLAB chests |
| `sg-public-api-static.hoyolab.com/.../v3/map/point/list?label_ids=186` | HoYoLAB puzzle/shrine/seelie/time-trial |
| `sg-public-api-static.hoyolab.com/.../v3/map/point/list?label_ids=4` | HoYoLAB special items |
| `sg-public-api.hoyolab.com/.../v1/map/point/add_mark_map_point` | Mark a point as collected |

## Limitations

- HoYoLAB's chest marker database covers only a subset of all in-game chests (community-contributed, not exhaustive)
- Running the script a second time is safe — already-marked points return a non-zero retcode and are counted as errors, not double-marked
- AppSample's cloud save URL (`collect_progress.v1.json`) must be publicly accessible; this is the default for Free Cloud Save accounts

## License

MIT
