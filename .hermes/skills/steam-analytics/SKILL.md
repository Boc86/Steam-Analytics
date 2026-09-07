---
name: steam-analytics
description: Steam Analytics project development - React 19 + TypeScript + Express + Render deployment
category: software-development
---

# Steam Analytics

Develop and maintain the Steam Analytics dashboard — a React 19 + TypeScript + Vite + Express app deployed on Render.

## Project Structure

```
Steam-Analytics/
├── server.ts              # Express API server
├── src/
│   ├── components/
│   │   ├── GameDetailModal.tsx   # Game detail modal with charts
│   │   ├── Header.tsx            # Currency selector
│   │   └── ChartsView.tsx        # Main charts view
│   ├── utils/
│   │   └── formatters.ts         # Price/time formatters
│   └── types.ts                  # TypeScript types
├── package.json
└── render.yaml                   # Render deployment config
```

## Key Data Sources

### Steam APIs
- **App Details**: `https://store.steampowered.com/api/appdetails?appids={id}&cc={country}`
  - Use `?cc=` parameter for regional pricing (USD→US, GBP→GB, EUR→DE)
- **Reviews**: `https://store.steampowered.com/appreviews/{appid}?json=1&filter=recent&num_per_page=100`
  - ⚠️ **Limitation**: Only returns 100 recent reviews
  - Use `cursor` parameter for pagination (only goes backward in time)
  - Reviews have `timestamp_created` field (Unix timestamp)

### External APIs
- **SteamCharts**: `https://steamcharts.com/app/{appid}` — player counts (24h, 7d history)
- **ProtonDB**: `https://www.protondb.com/api/v1/reports/summaries/{appid}.json` — Linux compatibility

## Common Pitfalls

### 1. Review Filter Must Be Independent
The review timeframe filter (`reviewTimeframe`) must use its own state, NOT `chartTimeframe`. Bug pattern:

```typescript
// WRONG - uses chartTimeframe for review bucketing
const key = chartTimeframe === 'day' || chartTimeframe === 'week'
  ? date.toISOString().slice(0, 13)
  : date.toISOString().slice(0, 7);

// CORRECT - uses reviewTimeframe
const key = reviewTimeframe === 'day' || reviewTimeframe === 'week'
  ? date.toISOString().slice(0, 13)
  : date.toISOString().slice(0, 7);
```

Check lines ~134 and ~144 in `GameDetailModal.tsx`.

### 2. Date.now() vs new Date()
When using Date methods (getFullYear, getMonth, etc.), use `new Date()` not `Date.now()`:

```typescript
// WRONG
const now = Date.now();  // Returns number
const year = now.getFullYear();  // ERROR: getFullYear doesn't exist on number

// CORRECT
const now = new Date();  // Returns Date object
const year = now.getFullYear();  // Works
```

### 3. Render Auto-Deploy on Push
Pushing to `main` triggers an automatic Render deployment. Be careful:
- Build locally first: `node_modules/.bin/vite build`
- Run type check: `node_modules/.bin/tsc --noEmit`
- Only push when ready

### 4. Limited Review History
The Steam API only provides 100 recent reviews. For games with few recent reviews, the trend graph will be sparse. This is a data limitation, not a bug.

## Timeframe Bucketing

Both player charts and review charts use these timeframes:
- `day` — hourly buckets (last 24h)
- `week` — daily buckets (last 7 days)
- `month` — weekly buckets (current month)
- `year` — monthly buckets (last 12 months)
- `all_time` — yearly buckets (all available data)

Use consistent MM/DD label format for both charts.

## Build & Deploy

```bash
# Type check
node_modules/.bin/tsc --noEmit

# Build frontend
node_modules/.bin/vite build

# Build full (frontend + server)
npm run build

# Start dev server
npm run dev  # runs tsx server.ts
```

Render deployment: pushes to `main` auto-trigger deployment via webhook.
