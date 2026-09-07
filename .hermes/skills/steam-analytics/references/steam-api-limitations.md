# Steam API Review Data Limitations

## Problem
The Steam appreviews API only returns 100 recent reviews per request. This means:
- Games with few recent reviews have sparse data
- Historical review trends are limited to ~100 data points
- Cannot get full review history without pagination

## API Response Structure
```json
{
  "success": 1,
  "query_summary": {
    "total_reviews": 485434,
    "total_positive": 459012,
    "total_negative": 26422,
    "score_percent": 95
  },
  "reviews": [...],  // max 100 reviews
  "cursor": "AoJw5/qEvqADc9Wl/wY="  // pagination cursor
}
```

## Review Object
```json
{
  "recommendationid": "234703433",
  "author": {
    "steamid": "76561198316021371",
    "playtime_forever": 13794,
    "playtime_at_review": 13794
  },
  "timestamp_created": 1725734400,  // Unix timestamp
  "timestamp_updated": 1725734400,
  "voted_up": true,
  "votes_up": 5,
  "votes_funny": 0,
  "weighted_vote_score": "0.85"
}
```

## Pagination Strategy
To get more reviews, use the `cursor` parameter:
```
https://store.steampowered.com/appreviews/{appid}?cursor={cursor}&num_per_page=100
```

⚠️ **Important**: The cursor moves backward in time (older reviews). To get a full history, you'd need to paginate through all 100-review batches until the cursor is empty. This could be 1000+ API calls for popular games.

## Current Implementation
The server code (`server.ts` lines 47-75) only fetches the first 100 reviews:
```typescript
const response = await fetch(`https://store.steampowered.com/appreviews/${appId}?json=1&language=all&purchase_type=all&filter=recent&num_per_page=100`);
```

This is sufficient for:
- Recent review trends (last few hours/days)
- Overall rating display
- Games with <100 recent reviews

For games with hundreds of thousands of reviews (e.g., Palworld with 485k), the 100 most recent reviews may only span a few hours.

## Alternative Data Sources
- **SteamDB**: Requires API key, has historical pricing/review data
- **SteamSpy**: Has rating trends but no API key needed
- **Scrapping**: Could scrape review pages but violates ToS

## Recommendation
For now, accept the limitation. The review trend chart shows recent sentiment (last 100 reviews) which is useful for detecting sudden spikes in positive/negative feedback. Historical review data is not available without significant API calls or third-party services.
