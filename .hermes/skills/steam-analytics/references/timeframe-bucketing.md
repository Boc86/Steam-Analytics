# Timeframe Bucketing Reference

## Player Chart (concurrent players)
Uses actual data from SteamCharts API:
- `day`: `playerHistory24h` — hourly data points (00:00 to current hour)
- `week`: `playerHistory7d` — daily data points (last 7 days)
- `month`: Simulated weekly buckets for current month
- `year`: Simulated monthly buckets (last 12 months)
- `all_time`: Release year vs current year

## Review Chart (positive % trend)
Uses aggregated review data from Steam appreviews API:
- `day`: Hourly buckets (`MM/DD HH:00`)
- `week`: Daily buckets (`MM/DD`)
- `month`: Weekly buckets (`MM/DD-MM/DD`)
- `year`: Monthly buckets (`MM/YY`)
- `all_time`: Yearly buckets (`YYYY`)

## Label Format Consistency
Both charts should use the same label format for matching timeframes:
- Day: `09/07 14:00`, `09/07 15:00`, etc.
- Week: `09/01`, `09/02`, etc.
- Month: `09/01-09/07`, `09/08-09/14`, etc.
- Year: `09/26`, `08/26`, etc.
- All: `2024`, `2025`, `2026`

## Implementation Pattern
```typescript
// Day (hourly)
const h = date.getHours();
key = `${year}-${month}-${date}-H${h}`;
label = `${month}/${date} ${String(h).padStart(2, '0')}:00`;

// Week (daily)
key = `${year}-${month}-${date}`;
label = `${month}/${date}`;

// Month (weekly)
const weekNum = Math.floor(dayOfYear / 7);
key = `${year}-W${weekNum}`;
label = `${weekStart}/${weekEnd}`;

// Year (monthly)
key = `${year}-${month}`;
label = `${month}/${String(year).slice(-2)}`;

// All time (yearly)
key = String(year);
label = String(year);
```
