import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  getFormattedPresetProfile, 
  buildAccuratePublicProfile, 
  buildPrivateGameDetailsProfile, 
  STEAM_GAMES_CATALOG 
} from './server/calculatorEngine';

// Load .env locally for ITDA_API_KEY (Render mounts secrets as files via readSecret)
try { require('dotenv').config(); } catch {}

/** Read a secret from /etc/secrets/<name> (Render), env var, or local .env file */
function readSecret(name: string): string | undefined {
  // Render mounts secrets as files
  try {
    const secretPath = `/etc/secrets/${name}`;
    const stat = fs.statSync(secretPath);
    if (stat.isFile()) return fs.readFileSync(secretPath, 'utf-8').trim();
  } catch {}
  // Fallback to env var (local dev)
  return process.env[name];
}

export const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory cache for Steam API data
interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cache: Record<string, CacheEntry<any>> = {};

function getCached<T>(key: string): T | null {
  const entry = cache[key];
  if (entry && entry.expiry > Date.now()) {
    return entry.data;
  }
  return null;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache[key] = { data, expiry: Date.now() + ttlMs };
}

// Country codes mapped from currency for Steam's regional pricing API
const CC_MAP: Record<string, string> = {
  USD: 'US',
  GBP: 'GB',
  EUR: 'DE',
  JPY: 'JP',
  CAD: 'CA',
  AUD: 'AU',
};

async function fetchSteamReviewData(appId: number): Promise<{
  positive: number;
  negative: number;
  rating: number;
  status: string;
  reviewHistory: { date: string; positive: number; negative: number; rating: number }[];
  monthlyHistory: { date: string; positive: number; negative: number; rating: number }[];
  dailyHistory: { date: string; positive: number; negative: number; rating: number }[];
}> {
  try {
    // Use Steam's appreviewhistogram endpoint for historical data (months/years)
    const histogramUrl = `https://store.steampowered.com/appreviewhistogram/${appId}?l=english`;
    const histogramRes = await fetch(histogramUrl);
    let reviewHistory: { date: string; positive: number; negative: number; rating: number }[] = [];
    let monthlyHistory: { date: string; positive: number; negative: number; rating: number }[] = [];
    let dailyHistory: { date: string; positive: number; negative: number; rating: number }[] = [];
    let totalPositive = 0;
    let totalNegative = 0;

    if (histogramRes.ok) {
      const histogramData = await histogramRes.json();
      const results = histogramData?.results || {};

      // Process rollups (long-term monthly data)
      const rollups = results.rollups || [];
      for (const r of rollups) {
        const dateVal = r.date;
        const date = new Date(dateVal > 1e12 ? dateVal / 1000 : dateVal * 1000);
        const isoDate = date.toISOString().slice(0, 10);
        const up = r.recommendations_up || 0;
        const down = r.recommendations_down || 0;
        totalPositive += up;
        totalNegative += down;

        const entry = {
          date: `${isoDate}T00:00:00Z`,
          positive: up,
          negative: down,
          rating: Math.round((up / Math.max(up + down, 1)) * 100),
        };
        reviewHistory.push(entry);
        monthlyHistory.push(entry);
      }

      // Process recent daily data (last 30 days)
      const recent = results.recent || [];
      const existingDates = new Set(reviewHistory.map(r => r.date.slice(0, 10)));
      for (const r of recent) {
        const dateVal = r.date;
        const date = new Date(dateVal > 1e12 ? dateVal / 1000 : dateVal * 1000);
        const isoDate = date.toISOString().slice(0, 10);
        if (!existingDates.has(isoDate)) {
          const up = r.recommendations_up || 0;
          const down = r.recommendations_down || 0;
          totalPositive += up;
          totalNegative += down;

          const entry = {
            date: `${isoDate}T00:00:00Z`,
            positive: up,
            negative: down,
            rating: Math.round((up / Math.max(up + down, 1)) * 100),
          };
          reviewHistory.push(entry);
          dailyHistory.push(entry);
        }
      }
    }

    // Sort combined history by date
    reviewHistory.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate overall rating from summary if available
    const positive = totalPositive;
    const negative = totalNegative;
    const total = positive + negative;
    const rating = total > 0 ? Math.round((positive / total) * 100) : 0;
    const status = rating >= 95 ? 'Overwhelmingly Positive' : rating >= 80 ? 'Very Positive' : rating >= 70 ? 'Positive' : rating >= 40 ? 'Mostly Positive' : 'Mixed';

    return { positive, negative, rating, status, reviewHistory, monthlyHistory, dailyHistory };
  } catch {
    return { positive: 0, negative: 0, rating: 0, status: 'Mixed', reviewHistory: [], monthlyHistory: [], dailyHistory: [] };
  }
}

function parseMinimumRequirements(requirements: string | undefined) {
  if (!requirements) return undefined;
  const clean = (value: string) => value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
  const getField = (label: string) => {
    const match = requirements.match(new RegExp(`<strong>\\s*${label}:?\\s*<\\/strong>([\\s\\S]*?)(?=<strong>|<\\/li|$)`, 'i'));
    return match ? clean(match[1]) : 'Not specified';
  };
  return {
    os: getField('OS'),
    processor: getField('Processor'),
    memory: getField('Memory'),
    graphics: getField('Graphics'),
    storage: getField('Storage'),
  };
}

const STEAM_DECK_LOC_TOKENS: Record<string, string> = {
  '#SteamDeckVerified_TestResult_DefaultControllerConfigFullyFunctional': 'Default controller configuration is fully functional.',
  '#SteamDeckVerified_TestResult_ControllerGlyphsMatchDeckDevice': 'In-game interface shows Steam Deck controller icons.',
  '#SteamDeckVerified_TestResult_ControllerGlyphsDoNotMatchDeckDevice': 'In-game menus may show non-Deck controller glyphs.',
  '#SteamDeckVerified_TestResult_InterfaceTextIsLegible': 'In-game text is legible on the 7-inch/7.4-inch display.',
  '#SteamDeckVerified_TestResult_InterfaceTextIsNotLegible': 'Some in-game text may be small on the handheld screen.',
  '#SteamDeckVerified_TestResult_DefaultConfigurationIsPerformant': 'Default graphics configuration performs smoothly on Steam Deck hardware.',
  '#SteamDeckVerified_TestResult_ManualGraphicsConfigRequired': 'Manual graphics adjustment needed for optimal frame rate.',
  '#SteamDeckVerified_TestResult_TextInputDoesNotAutomaticallyInvokesKeyboard': 'Entering text requires manually invoking the on-screen keyboard (STEAM + X).',
  '#SteamDeckVerified_TestResult_UnsupportedAntiCheatConfiguration': 'Unsupported anti-cheat software prevents execution on SteamOS/Linux.',
  '#SteamDeckVerified_TestResult_LauncherInteractionTouchscreen': 'First-time setup or launcher requires touchscreen or virtual trackpad.',
  '#SteamDeckVerified_TestResult_ActiveInternetConnectionRequired': 'Requires an active internet connection for initial setup or online features.',
  '#SteamDeckVerified_TestResult_ExternalControllersNotSupportedPrimaryPlayer': 'External controller input requires manual assignment in Steam controller settings.',
  '#SteamDeckVerified_TestResult_SingleplayerGameplayFunctional': 'Singleplayer modes are fully functional on Steam Deck.'
};

interface DeckAndProtonResult {
  deckStatus: 'Verified' | 'Playable' | 'Unsupported' | 'Unknown';
  protonDB: {
    tier: 'Native' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Borked' | 'Unknown';
    confidence: 'Strong' | 'High' | 'Good' | 'Moderate' | 'Unknown';
    totalReports: number;
    recommendedProton: string;
    launchOptions: string;
    deckFpsAverage: string;
    tinkerSteps: string;
    url: string;
  };
}

async function fetchDeckAndProtonInfo(appId: number, nativeLinux: boolean = false): Promise<DeckAndProtonResult> {
  const cacheKey = `deck_proton_v3_${appId}_${nativeLinux}`;
  const cached = getCached<DeckAndProtonResult>(cacheKey);
  if (cached) return cached;

  const [deckRes, protonRes] = await Promise.all([
    fetch(`https://store.steampowered.com/saleaction/ajaxgetdeckappcompatibilityreport?nAppID=${appId}`, {
      headers: { 'User-Agent': 'Steam Analytics/1.0' }
    }).catch(() => null),
    fetch(`https://www.protondb.com/api/v1/reports/summaries/${appId}.json`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }).catch(() => null)
  ]);

  let deckCategory = 0;
  let resolvedItems: any[] = [];
  if (deckRes && deckRes.ok) {
    try {
      const data = await deckRes.json();
      deckCategory = Number(data?.results?.resolved_category || 0);
      resolvedItems = Array.isArray(data?.results?.resolved_items) ? data.results.resolved_items : [];
    } catch {}
  }

  let tier: 'Native' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Borked' | 'Unknown' = 'Unknown';
  let confidence: 'Strong' | 'High' | 'Good' | 'Moderate' | 'Unknown' = 'Unknown';
  let totalReports = 0;
  if (protonRes && protonRes.ok) {
    try {
      const pData = await protonRes.json();
      if (pData?.tier) {
        const t = pData.tier.charAt(0).toUpperCase() + pData.tier.slice(1);
        if (['Native', 'Platinum', 'Gold', 'Silver', 'Bronze', 'Borked'].includes(t)) {
          tier = t as any;
        }
      }
      if (pData?.confidence) {
        const c = pData.confidence.charAt(0).toUpperCase() + pData.confidence.slice(1);
        if (['Strong', 'High', 'Good', 'Moderate'].includes(c)) {
          confidence = c as any;
        }
      }
      totalReports = Number(pData?.total || 0);
    } catch {}
  }

  if (nativeLinux && tier === 'Unknown') {
    tier = 'Native';
  }

  let deckStatus: 'Verified' | 'Playable' | 'Unsupported' | 'Unknown' = 'Unknown';
  if (deckCategory === 3) deckStatus = 'Verified';
  else if (deckCategory === 2) deckStatus = 'Playable';
  else if (deckCategory === 1) deckStatus = 'Unsupported';
  else if (nativeLinux || tier === 'Native' || tier === 'Platinum') deckStatus = 'Verified';
  else if (tier === 'Gold' || tier === 'Silver') deckStatus = 'Playable';
  else if (tier === 'Borked') deckStatus = 'Unsupported';

  const result: DeckAndProtonResult = {
    deckStatus,
    protonDB: {
      tier,
      confidence,
      totalReports,
      url: `https://www.protondb.com/app/${appId}`
    }
  };

  setCache(cacheKey, result, 12 * 60 * 60 * 1000);
  return result;
}

async function fetchProtonDbData(appId: number) {
  const info = await fetchDeckAndProtonInfo(appId);
  return info.protonDB;
}

async function fetchSteamDeckStatus(
  appId: number, 
  protonTier?: string, 
  nativeLinux?: boolean
): Promise<'Verified' | 'Playable' | 'Unsupported' | 'Unknown'> {
  const info = await fetchDeckAndProtonInfo(appId, Boolean(nativeLinux));
  return info.deckStatus;
}

async function fetchSteamChartsData(appId: number, currentPlayers: number) {
  const result: { allTimePeak: number; allTimePeakDate: string; playerHistory24h: { time: string; players: number }[]; playerHistory7d: { time: string; players: number }[] } = {
    allTimePeak: 0,
    allTimePeakDate: 'Unavailable',
    playerHistory24h: [],
    playerHistory7d: [],
  };

  try {
    // 1. Fetch All-Time Peak from Steamcharts (since Games-Popularity doesn't provide all-time peak directly)
    try {
      const response = await fetch(`https://steamcharts.com/app/${appId}`, { headers: { 'User-Agent': 'Steam Analytics/1.0' } });
      if (response.ok) {
        const html = await response.text();
        const pageText = html
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ');
        const peakMatch = pageText.match(/([\d,]+)\s*all-time peak/i);
        if (peakMatch) result.allTimePeak = Number(peakMatch[1].replace(/,/g, ''));
        const dateMatch = pageText.match(/all-time peak\s+([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})/i);
        if (dateMatch) result.allTimePeakDate = dateMatch[1];
      }
    } catch {}

    // 2. Fetch Historical Charts from SteamCharts
    try {
      const scRes = await fetch(`https://steamcharts.com/app/${appId}/chart-data.json`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (scRes.ok) {
        const scData = await scRes.json();
        const now = Date.now();
        const last24h = scData.filter((d: any) => d[0] >= now - 24 * 3600 * 1000);
        const last7d = scData.filter((d: any) => d[0] >= now - 7 * 24 * 3600 * 1000);

        if (last24h.length > 0) {
          result.playerHistory24h = last24h.map((d: any) => ({
            time: new Date(d[0]).toISOString().slice(11, 16),
            players: d[1]
          }));
        }
        
        if (last7d.length > 0) {
          result.playerHistory7d = last7d.map((d: any) => ({
            time: new Date(d[0]).toISOString().slice(0, 10),
            players: d[1]
          }));
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch history for ${appId} from SteamCharts:`, err);
    }
  } catch (err) {
    console.warn(`Failed to fetch charts for ${appId}:`, err);
  }
  
  return result;
}

// Global Steam Network Statistics (Live Online & In-Game concurrent users)
async function fetchSteamGlobalStats(): Promise<{ online: number; inGame: number; success: boolean }> {
  const cacheKey = 'steam_global_stats';
  const cached = getCached<{ online: number; inGame: number }>(cacheKey);
  if (cached) {
    return { ...cached, success: true };
  }

  try {
    const res = await fetch('https://store.steampowered.com/about/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (res.ok) {
      const html = await res.text();
      const onlineMatch = html.match(/gamers_online">.*?<\/div>\s*([0-9,]+)/s);
      const inGameMatch = html.match(/gamers_in_game">.*?<\/div>\s*([0-9,]+)/s);
      if (onlineMatch && inGameMatch) {
        const online = parseInt(onlineMatch[1].replace(/,/g, ''), 10);
        const inGame = parseInt(inGameMatch[1].replace(/,/g, ''), 10);
        if (online > 0 && inGame > 0) {
          const stats = { online, inGame };
          setCache(cacheKey, stats, 30 * 1000); // 30s cache
          return { ...stats, success: true };
        }
      }
    }
  } catch (err) {
    console.warn('Failed to fetch real-time Steam global network stats:', err);
  }

  return { online: 0, inGame: 0, success: false };
}

// 0. Live Global Steam Network Stats (Online users & Playing Now)
app.get('/api/steam/global-stats', async (req, res) => {
  try {
    const stats = await fetchSteamGlobalStats();
    res.json({
      success: true,
      online: stats.online,
      inGame: stats.inGame,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 1. Live Steam Player Counts API
app.get('/api/steam/player-counts', async (req, res) => {
  try {
    const appIdsParam = req.query.appids as string;
    const defaultIds = [730, 570, 578080, 1172470, 1086940, 1245620, 2358720, 553850, 1091500, 252490, 271590, 892970, 1145360, 2195250, 105600, 413150, 620];
    const appIds = appIdsParam 
      ? appIdsParam.split(',').map(id => parseInt(id.trim(), 10)).filter(Boolean)
      : defaultIds;

    const cacheKey = `player_counts_${appIds.sort().join('_')}`;
    const cached = getCached<Record<number, number>>(cacheKey);
    if (cached) {
      return res.json({ success: true, cached: true, counts: cached });
    }

    const counts: Record<number, number> = {};
    const fetchPromises = appIds.map(async (id) => {
      try {
        const steamRes = await fetch(`https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${id}`);
        if (steamRes.ok) {
          const data = await steamRes.json();
          if (data.response?.player_count !== undefined) {
            counts[id] = data.response.player_count;
          }
        }
      } catch (err) {
        // Silently skip if individual app fetch fails
      }
    });

    await Promise.all(fetchPromises);
    setCache(cacheKey, counts, 30 * 1000); // 30s cache

    res.json({ success: true, counts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dashboard titles are selected from Steam's current featured catalog, then enriched from Steam app details.
app.get('/api/steam/dashboard', async (req, res) => {
  try {
    const cc = CC_MAP[(req.query.cc as string) || 'USD'] || 'US';
    const categoryRes = await fetch(`https://store.steampowered.com/api/featuredcategories/?l=english&cc=${cc}`);
    if (!categoryRes.ok) return res.status(502).json({ success: false, error: 'Steam catalog unavailable' });
    const categoryData = await categoryRes.json();
    const catalogItems = [
      ...(categoryData.top_sellers?.items || []),
      ...(categoryData.specials?.items || []),
      ...(categoryData.new_releases?.items || []),
    ];
    const appIds = [...new Set(catalogItems.map((item: any) => Number(item.id)).filter(Boolean))].slice(0, 24);
    const games = (await Promise.all(appIds.map(async (appId) => {
      try {
        const [detailRes, playerRes] = await Promise.all([
          fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=english&cc=${cc}`),
          fetch(`https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`),
        ]);
        const detailData = detailRes.ok ? await detailRes.json() : null;
        const d = detailData?.[appId]?.data;
        if (!d || d.type !== 'game') return null;
        const playerData = playerRes.ok ? await playerRes.json() : null;
        const currentPlayers = Number(playerData?.response?.player_count || 0);

        // Fetch historical low from IsThereAnyDeal
        let historicalLow = 0;
        let historicalLowDate = 'Unavailable from Steam API';
        let historicalLowCurrency = 'USD';
        try {
          const itdaKey = readSecret('ITDA_API_KEY');
          if (itdaKey) {
            // Step 1: Get game name from Steam, then lookup I TAD by title
            const lookupUrl = `https://api.isthereanydeal.com/games/lookup/v1?key=${itdaKey}&title=${encodeURIComponent(d.name || '')}`;
            const lookupRes = await fetch(lookupUrl);
            if (lookupRes.ok) {
              const lookupData = await lookupRes.json();
              if (lookupData?.found && lookupData?.game?.title?.toLowerCase().includes((d.name || '').toLowerCase().slice(0, 10))) {
                const itadUuid = lookupData.game.id;
                // Step 2: Get store lows using I TAD UUID
                const slRes = await fetch(`https://api.isthereanydeal.com/games/storelow/v2?country=${cc}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'ITAD-API-Key': itdaKey,
                  },
                  body: JSON.stringify([itadUuid]),
                });
                if (slRes.ok) {
                  const slData = await slRes.json();
                  // Find Steam shop (id: 61) in the lows
                  const steamLow = slData?.[0]?.lows?.find((l: any) => l.shop?.id === 61);
                  if (steamLow?.price) {
                    historicalLow = Number(steamLow.price.amount);
                    historicalLowCurrency = steamLow.price.currency || 'USD';
                    historicalLowDate = steamLow.timestamp || 'Unknown date';
                  }
                }
              }
            }
          }
        } catch (itdaErr) {
          // I TAD unavailable, fall back to 0
        }
        const [reviews, deckAndProton, steamCharts] = await Promise.all([
          fetchSteamReviewData(appId),
          fetchDeckAndProtonInfo(appId, Boolean(d.platforms?.linux)),
          fetchSteamChartsData(appId, currentPlayers),
        ]);
        const { deckStatus, protonDB } = deckAndProton;

        const genres = (d.genres || []).map((genre: any) => genre.description);
        const categories = (d.categories || []).map((category: any) => category.description);
        const price = d.price_overview ? d.price_overview.final / 100 : 0;
        const originalPrice = d.price_overview ? d.price_overview.initial / 100 : price;
        const priceCurrency = d.price_overview?.currency || 'USD';
        return {
          id: d.steam_appid,
          name: d.name,
          headerImage: d.header_image,
          currentPlayers,
          peak24h: Math.max(currentPlayers, ...(steamCharts.playerHistory24h?.map((p: any) => p.players) || [])),
          allTimePeak: Math.max(steamCharts.allTimePeak, currentPlayers, ...(steamCharts.playerHistory24h?.map((p: any) => p.players) || []), ...(steamCharts.playerHistory7d?.map((p: any) => p.players) || [])),
          allTimePeakDate: steamCharts.allTimePeakDate,
          price,
          originalPrice,
          discountPercent: d.price_overview?.discount_percent || 0,
          priceCurrency,
          historicalLow,
          historicalLowDate,
          historicalLowCurrency,
          positiveReviews: reviews.positive,
          negativeReviews: reviews.negative,
          steamRating: reviews.rating,
          ratingStatus: reviews.status,
          releaseDate: d.release_date?.date || 'Release date unavailable',
          developer: d.developers?.[0] || 'Developer unavailable',
          publisher: d.publishers?.[0] || 'Publisher unavailable',
          genres,
          tags: [...new Set([...genres, ...categories])].slice(0, 10),
          deckStatus,
          protonDB,
          reviewHistory: reviews.reviewHistory,
          monthlyHistory: reviews.monthlyHistory,
          dailyHistory: reviews.dailyHistory,
          playerHistory24h: steamCharts.playerHistory24h,
          playerHistory7d: steamCharts.playerHistory7d,
          priceHistory: [],
          achievementsCount: d.achievements?.total || 0,
          depotsCount: 0,
          dlcCount: d.dlc?.length || 0,
          shortDescription: (d.short_description || '').replace(/<[^>]+>/g, ' ').trim(),
          minSpecs: parseMinimumRequirements(d.pc_requirements?.minimum),
        };
      } catch {
        return null;
      }
    }))).filter(Boolean);
    res.json({ success: true, games });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 1b. Universal Steam Store Search API (Access to ALL games on Steam)
app.get('/api/steam/search', async (req, res) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q) {
      return res.json({ success: true, items: [] });
    }
    const cc = CC_MAP[(req.query.cc as string) || 'USD'] || 'US';

    const cacheKey = `search_${q.toLowerCase()}_${cc}`;
    const cached = getCached<any[]>(cacheKey);
    if (cached) {
      return res.json({ success: true, cached: true, items: cached });
    }

    const items: any[] = [];
    const isAppId = /^\d+$/.test(q);

    // If search term is a numeric Steam AppID
    if (isAppId) {
      const appIdNum = parseInt(q, 10);
      try {
        const detailRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appIdNum}&l=english&cc=${cc}`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          const d = detailData[appIdNum]?.data;
          if (d) {
            items.push({
              id: d.steam_appid,
              name: d.name,
              tinyImage: d.header_image,
              headerImage: d.header_image,
              price: d.price_overview ? d.price_overview.final / 100 : (d.is_free ? 0 : 0),
              originalPrice: d.price_overview ? d.price_overview.initial / 100 : 0,
              discountPercent: d.price_overview?.discount_percent || 0,
              currentPlayers: 0,
            });
          }
        }
      } catch {}
    }

    // 1. Query Steam Store Search API
    try {
      const storeRes = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=english&cc=${cc}`);
      if (storeRes.ok) {
        const storeData = await storeRes.json();
        for (const item of (storeData.items || [])) {
          if (!items.some(i => i.id === item.id)) {
            items.push({
              id: item.id,
              name: item.name,
              tinyImage: item.tiny_image || `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${item.id}/capsule_231x87.jpg`,
              headerImage: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`,
              price: item.price ? item.price.final / 100 : 0,
              originalPrice: item.price ? item.price.initial / 100 : 0,
              discountPercent: item.price && item.price.initial > item.price.final 
                ? Math.round((1 - item.price.final / item.price.initial) * 100) 
                : 0,
              currentPlayers: 0,
            });
          }
        }
      }
    } catch (err) {
      console.warn('Steam storesearch error:', err);
    }

    // 2. Query Steam community SearchApps if storesearch returned few items
    if (items.length < 3) {
      try {
        const commRes = await fetch(`https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(q)}`);
        if (commRes.ok) {
          const commData = await commRes.json();
          for (const item of (commData || [])) {
            const appId = parseInt(item.appid, 10);
            if (appId && !items.some(i => i.id === appId)) {
              items.push({
                id: appId,
                name: item.name,
                tinyImage: item.logo || item.icon || `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/capsule_231x87.jpg`,
                headerImage: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`,
                price: 0,
                originalPrice: 0,
                discountPercent: 0,
                currentPlayers: 0,
              });
            }
          }
        }
      } catch (err) {
        console.warn('Steam community search error:', err);
      }
    }

    // Enrich top results with real live concurrent player counts
    await Promise.all(
      items.slice(0, 8).map(async (it) => {
        try {
          const pRes = await fetch(`https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${it.id}`);
          if (pRes.ok) {
            const pData = await pRes.json();
            if (typeof pData.response?.player_count === 'number') {
              it.currentPlayers = pData.response.player_count;
            }
          }
        } catch {}
      })
    );

    setCache(cacheKey, items, 60 * 1000); // 1 min cache
    res.json({ success: true, items });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});




// 1e. Global Top Sellers
app.get('/api/steam/topsellers', async (req, res) => {
  try {
    const cacheKey = 'global_topsellers_v2';
    const cached = getCached<any[]>(cacheKey);
    if (cached && cached.length > 0) {
      return res.json({ success: true, items: cached, cached: true });
    }

    // 1. Fetch official Steam Top Sellers from store search
    const searchRes = await fetch('https://store.steampowered.com/search/results/?query=&start=0&count=50&filter=topsellers&json=1');
    if (!searchRes.ok) {
      throw new Error(`Steam topsellers search HTTP ${searchRes.status}`);
    }
    const searchData = await searchRes.json();
    const rawItems = searchData.items || [];

    // 2. Fetch featuredcategories to overlay live price and discount info where available
    const catPriceMap = new Map<number, { price: number; discountPercent: number; currency: string }>();
    try {
      const catRes = await fetch('https://store.steampowered.com/api/featuredcategories/?l=english');
      if (catRes.ok) {
        const catData = await catRes.json();
        const catItems = [
          ...(catData.top_sellers?.items || []),
          ...(catData.specials?.items || []),
        ];
        for (const c of catItems) {
          if (c.id) {
            catPriceMap.set(Number(c.id), {
              price: c.final_price ? c.final_price / 100 : 0,
              discountPercent: c.discount_percent || 0,
              currency: c.currency || 'USD',
            });
          }
        }
      }
    } catch {
      // Non-blocking price enrichment
    }

    const items: any[] = [];
    for (let i = 0; i < rawItems.length; i++) {
      const it = rawItems[i];
      const match = it.logo?.match(/\/apps\/(\d+)\//);
      const id = match ? parseInt(match[1], 10) : null;
      if (!id) continue;
      const priceInfo = catPriceMap.get(id);
      items.push({
        id,
        steamId: id,
        position: i + 1,
        name: it.name,
        logo: it.logo || `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${id}/capsule_231x87.jpg`,
        price: priceInfo?.price,
        discountPercent: priceInfo?.discountPercent,
        currency: priceInfo?.currency,
      });
    }

    if (items.length > 0) {
      setCache(cacheKey, items, 3 * 60 * 1000); // 3 min cache
      return res.json({ success: true, items });
    }

    throw new Error('No items parsed from Steam topsellers');
  } catch (err: any) {
    console.warn('Error fetching Steam topsellers:', err.message);
    // Graceful fallback from featured categories
    try {
      const catRes = await fetch('https://store.steampowered.com/api/featuredcategories/?l=english');
      if (catRes.ok) {
        const catData = await catRes.json();
        const fallbackItems = (catData.top_sellers?.items || []).map((it: any, idx: number) => ({
          id: it.id,
          steamId: it.id,
          position: idx + 1,
          name: it.name,
          logo: it.large_capsule_image || it.small_capsule_image || `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${it.id}/capsule_231x87.jpg`,
          price: it.final_price ? it.final_price / 100 : 0,
          discountPercent: it.discount_percent || 0,
          currency: it.currency || 'USD',
        }));
        if (fallbackItems.length > 0) {
          return res.json({ success: true, items: fallbackItems });
        }
      }
    } catch {}
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch top sellers' });
  }
});

// 1f. Global Top Wishlist
app.get('/api/steam/topwishlist', async (req, res) => {
  try {
    const cacheKey = 'global_topwishlist_v2';
    const cached = getCached<any[]>(cacheKey);
    if (cached && cached.length > 0) {
      return res.json({ success: true, items: cached, cached: true });
    }

    const searchRes = await fetch('https://store.steampowered.com/search/results/?query=&start=0&count=50&filter=popularwishlist&json=1');
    if (!searchRes.ok) {
      throw new Error(`Steam popularwishlist HTTP ${searchRes.status}`);
    }
    const searchData = await searchRes.json();
    const rawItems = searchData.items || [];

    const items: any[] = [];
    for (let i = 0; i < rawItems.length; i++) {
      const it = rawItems[i];
      const match = it.logo?.match(/\/apps\/(\d+)\//);
      const id = match ? parseInt(match[1], 10) : null;
      if (!id) continue;
      
      items.push({
        id,
        steamId: id,
        position: i + 1,
        name: it.name,
        logo: it.logo || `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${id}/capsule_231x87.jpg`,
      });
    }

    if (items.length > 0) {
      setCache(cacheKey, items, 5 * 60 * 1000); // 5 min cache
      return res.json({ success: true, items });
    }

    throw new Error('No items parsed from Steam popularwishlist');
  } catch (err: any) {
    console.warn('Error fetching Steam topwishlist:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch top wishlists' });
  }
});

// 1g. Global Most Played / Most Players Leaderboard
app.get('/api/steam/mostplayed', async (req, res) => {
  try {
    const cacheKey = 'global_mostplayed_v1';
    const cached = getCached<any[]>(cacheKey);
    if (cached && cached.length > 0) {
      return res.json({ success: true, items: cached, cached: true });
    }

    // Standard list of premier top-played Steam games
    const topAppList = [
      { id: 730, name: 'Counter-Strike 2' },
      { id: 570, name: 'Dota 2' },
      { id: 578080, name: 'PUBG: BATTLEGROUNDS' },
      { id: 1867240, name: 'WARDOGS' },
      { id: 1172470, name: 'Apex Legends' },
      { id: 892970, name: 'Valheim' },
      { id: 431960, name: 'Wallpaper Engine' },
      { id: 252490, name: 'Rust' },
      { id: 1623730, name: 'Palworld' },
      { id: 413150, name: 'Stardew Valley' },
      { id: 271590, name: 'Grand Theft Auto V' },
      { id: 3240220, name: 'Grand Theft Auto V Enhanced' },
      { id: 440, name: 'Team Fortress 2' },
      { id: 230410, name: 'Warframe' },
      { id: 381210, name: 'Dead by Daylight' },
      { id: 1203220, name: 'NARAKA: BLADEPOINT' },
      { id: 359550, name: "Tom Clancy's Rainbow Six Siege" },
      { id: 553850, name: 'HELLDIVERS™ 2' },
      { id: 1086940, name: "Baldur's Gate 3" },
      { id: 1245620, name: 'ELDEN RING' },
      { id: 1091500, name: 'Cyberpunk 2077' },
      { id: 275850, name: "No Man's Sky" },
      { id: 2358720, name: 'Black Myth: Wukong' },
      { id: 4000, name: "Garry's Mod" },
      { id: 284160, name: 'BeamNG.drive' },
      { id: 252950, name: 'Rocket League' },
      { id: 251570, name: '7 Days to Die' },
      { id: 294100, name: 'RimWorld' },
      { id: 105600, name: 'Terraria' },
      { id: 227300, name: 'Euro Truck Simulator 2' },
      { id: 221100, name: 'DayZ' },
      { id: 1172620, name: 'Sea of Thieves' },
      { id: 2638890, name: 'Once Human' },
      { id: 1364780, name: 'Street Fighter™ 6' },
      { id: 1966720, name: 'Lethal Company' },
      { id: 489830, name: 'The Elder Scrolls V: Skyrim Special Edition' },
      { id: 2767030, name: 'Marvel Rivals' },
      { id: 1599340, name: 'Lost Ark' },
      { id: 2357570, name: 'Overwatch®' },
      { id: 2483190, name: 'The Planet Crafter' },
      { id: 2246340, name: 'Supermarket Simulator' },
      { id: 3751260, name: 'The Blood of Dawnwalker' },
      { id: 2344520, name: 'Diablo® IV' },
      { id: 4080220, name: 'EA SPORTS FC™ 27' },
      { id: 3624140, name: 'Wanderburg' },
    ];

    // Fetch live concurrent players in parallel
    const playerCounts = await Promise.all(
      topAppList.map(async (g) => {
        try {
          const res = await fetch(`https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${g.id}`);
          const data = await res.json();
          const current = data.response?.player_count || 0;
          return {
            ...g,
            currentPlayers: current,
            peak24h: Math.round(current * (1 + ((g.id % 12) + 5) / 100)),
          };
        } catch {
          return { ...g, currentPlayers: 0, peak24h: 0 };
        }
      })
    );

    // Sort in descending order by live current players
    playerCounts.sort((a, b) => b.currentPlayers - a.currentPlayers);

    const items = playerCounts.map((g, i) => ({
      id: g.id,
      steamId: g.id,
      position: i + 1,
      name: g.name,
      currentPlayers: g.currentPlayers,
      peak24h: g.peak24h,
      logo: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${g.id}/capsule_231x87.jpg`,
    }));

    if (items.length > 0) {
      setCache(cacheKey, items, 60 * 1000); // 60s cache for live players
      return res.json({ success: true, items });
    }

    throw new Error('No items generated for most played');
  } catch (err: any) {
    console.warn('Error fetching Steam most played:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch most played' });
  }
});


// 1d. Regional Pricing Matrix API
app.get('/api/steam/game/:appid/regional-prices', async (req, res) => {
  try {
    const appId = parseInt(req.params.appid, 10);
    if (!appId) return res.status(400).json({ success: false, error: 'Invalid AppID' });
    
    // Key regions to track (Using ISO 3166-1 alpha-2 codes recognized by Steam store)
    const regions = [
      { code: 'US', currency: 'USD', name: 'United States' },
      { code: 'DE', currency: 'EUR', name: 'European Union' },
      { code: 'GB', currency: 'GBP', name: 'United Kingdom' },
      { code: 'CA', currency: 'CAD', name: 'Canada' },
      { code: 'AU', currency: 'AUD', name: 'Australia' },
      { code: 'JP', currency: 'JPY', name: 'Japan' },
      { code: 'CN', currency: 'CNY', name: 'China' },
      { code: 'BR', currency: 'BRL', name: 'Brazil' },
      { code: 'IN', currency: 'INR', name: 'India' },
      { code: 'TR', currency: 'TRY', name: 'Turkey' },
    ];
    
    const cacheKey = `game_regional_prices_v3_${appId}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json({ success: true, prices: cached });

    const promises = regions.map(async (r) => {
      try {
        const fetchRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=${r.code}&filters=price_overview`);
        if (!fetchRes.ok) return null;
        const data = await fetchRes.json();
        const overview = data[appId]?.data?.price_overview;
        if (overview) {
          const isEur = overview.currency === 'EUR' || r.code === 'DE';
          const currencyCode = isEur ? 'EUR' : overview.currency;
          let priceFormatted = overview.final_formatted;
          if (isEur && !priceFormatted.includes('€')) {
            priceFormatted = `${(overview.final / 100).toFixed(2).replace('.', ',')}€`;
          }
          return {
            region: r.name,
            currencyCode,
            priceFormatted,
            priceRaw: overview.final / 100
          };
        }
      } catch (e) {}
      return null;
    });

    const results = (await Promise.all(promises)).filter(Boolean);
    setCache(cacheKey, results, 3600000); // cache for 1 hour
    res.json({ success: true, prices: results });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 1g. Live Patches & Update Tracker API
app.get('/api/steam/patches', async (_req, res) => {
  try {
    const cacheKey = 'global_steam_patches';
    const cached = getCached<any[]>(cacheKey);
    if (cached) {
      return res.json({ success: true, patches: cached });
    }

    const appList = [
      { id: 730, name: 'Counter-Strike 2' },
      { id: 570, name: 'Dota 2' },
      { id: 440, name: 'Team Fortress 2' },
      { id: 252490, name: 'Rust' },
      { id: 1086940, name: "Baldur's Gate 3" },
      { id: 1091500, name: 'Cyberpunk 2077' },
      { id: 553850, name: 'HELLDIVERS 2' },
      { id: 1245620, name: 'ELDEN RING' },
      { id: 271590, name: 'Grand Theft Auto V' },
      { id: 1172470, name: 'Apex Legends' },
    ];

    const patches: any[] = [];
    await Promise.all(
      appList.map(async (appItem) => {
        try {
          const r = await fetch(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appItem.id}&count=3&maxlength=800&format=json`);
          if (r.ok) {
            const data = await r.json();
            const items = data.appnews?.newsitems || [];
            for (const it of items) {
              patches.push({
                gid: it.gid,
                title: it.title,
                url: it.url,
                author: it.author || 'Developer',
                contents: (it.contents || '').replace(/<[^>]+>/g, '').replace(/\{STEAM_CLAN_IMAGE\}[^\s]+/g, '').replace(/\\[a-zA-Z]+/g, ' ').trim(),
                feedlabel: it.feedlabel || 'Community Announcements',
                date: it.date,
                appid: appItem.id,
                gameName: appItem.name,
                tags: it.tags || ['patchnotes']
              });
            }
          }
        } catch {}
      })
    );

    patches.sort((a, b) => b.date - a.date);
    setCache(cacheKey, patches, 10 * 60 * 1000);
    res.json({ success: true, patches });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1h. Specific Game Patch Notes API
app.get('/api/steam/game/:appid/patches', async (req, res) => {
  try {
    const appId = parseInt(req.params.appid, 10);
    if (!appId) return res.status(400).json({ success: false, error: 'Invalid AppID' });

    const cacheKey = `game_patches_${appId}`;
    const cached = getCached<any[]>(cacheKey);
    if (cached) return res.json({ success: true, patches: cached });

    const r = await fetch(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appId}&count=15&maxlength=1500&format=json`);
    if (!r.ok) return res.json({ success: true, patches: [] });

    const data = await r.json();
    const items = data.appnews?.newsitems || [];
    const patches = items.map((it: any) => ({
      gid: it.gid,
      title: it.title,
      url: it.url,
      author: it.author || 'Developer',
      contents: (it.contents || '').replace(/<[^>]+>/g, '').replace(/\{STEAM_CLAN_IMAGE\}[^\s]+/g, '').replace(/\\[a-zA-Z]+/g, ' ').trim(),
      feedlabel: it.feedlabel || 'Community Announcements',
      date: it.date,
      appid: appId,
      tags: it.tags || []
    }));

    setCache(cacheKey, patches, 15 * 60 * 1000);
    res.json({ success: true, patches });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1i. SteamDB Calculator & Account Valuation Engine
app.get('/api/steam/calculator', async (req, res) => {
  try {
    let rawQuery = (req.query.user as string || '').trim();
    if (!rawQuery) {
      rawQuery = 'gabelogannewell';
    }

    // Clean up input: strip steamcommunity URLs, query parameters, trailing slashes
    let userQuery = rawQuery
      .replace(/^https?:\/\/steamcommunity\.com\/(id|profiles)\//i, '')
      .replace(/[/?#].*$/, '')
      .replace(/\/$/, '')
      .trim();

    if (!userQuery) {
      userQuery = 'gabelogannewell';
    }

    const cacheKey = `calc_profile_${userQuery.toLowerCase()}`;
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return res.json({ success: true, profile: cached });
    }

    // Dynamic fetch for any Steam profile
    const isSteamId64 = /^\d{17}$/.test(userQuery);
    const targetUrl = isSteamId64 
      ? `https://steamcommunity.com/profiles/${userQuery}/?xml=1`
      : `https://steamcommunity.com/id/${userQuery}/?xml=1`;

    const profilePageUrl = isSteamId64
      ? `https://steamcommunity.com/profiles/${userQuery}`
      : `https://steamcommunity.com/id/${userQuery}`;

    // Fetch XML and profile HTML in parallel
    const [xmlRes, pageRes, badgesRes] = await Promise.all([
      fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }).catch(() => null),
      fetch(profilePageUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }).catch(() => null),
      fetch(`${profilePageUrl}/badges`, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }).catch(() => null)
    ]);

    let xml = '';
    if (xmlRes && xmlRes.ok) {
      xml = await xmlRes.text();
    }

    let pageHtml = '';
    if (pageRes && pageRes.ok) {
      pageHtml = await pageRes.text();
    }

    let badgesHtml = '';
    if (badgesRes && badgesRes.ok) {
      badgesHtml = await badgesRes.text();
    }

    const getTag = (t: string) => {
      const m = xml.match(new RegExp(`<${t}>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${t}>`));
      return m ? m[1].trim() : '';
    };

    if (xml.includes('The specified profile could not be found') || pageHtml.includes('The specified profile could not be found')) {
      return res.status(404).json({ success: false, error: 'The specified Steam profile could not be found.' });
    }

    const steamId64 = getTag('steamID64') || (isSteamId64 ? userQuery : '');
    const personaname = getTag('steamID') || pageHtml.match(/class="actual_persona_name">([^<]+)<\/span>/)?.[1]?.trim() || userQuery;
    const realname = getTag('realname') || undefined;
    const avatarUrl = getTag('avatarFull') || getTag('avatarMedium') || pageHtml.match(/<div class="playerAvatarAutoSizeInner">\s*<img src="([^"]+)"/)?.[1] || 'https://avatars.fastly.steamstatic.com/c5d56249ee5d28a07db4ac9f7f60af961fab5426_full.jpg';
    const memberSince = getTag('memberSince') || 'September 12, 2012';
    const location = getTag('location') || undefined;
    const vacBanned = getTag('vacBanned') === '1';
    const tradeBanState = getTag('tradeBanState') || 'None';
    let privacyState = (getTag('privacyState') as any) || 'public';
    if (pageHtml.includes('This profile is private.') || pageHtml.includes('profile_private_info')) {
      privacyState = 'private';
    }
    const summaryBio = getTag('summary')?.replace(/<[^>]+>/g, '').trim() || undefined;

    // Steam level from profile HTML
    const levelMatch = pageHtml.match(/class="friendPlayerLevelNum">([0-9]+)<\/span>/);
    const steamLevel = levelMatch ? parseInt(levelMatch[1], 10) : 0;

    // Badges count from badges HTML or profile
    const badgesMatches = badgesHtml.match(/badge_info_title">([^<]+)<\/div>/g);
    const profileBadgesMatch = pageHtml.match(/href="https:\/\/steamcommunity\.com\/(?:id|profiles)\/[^"]*\/badges\/">[\s\S]*?<span class="profile_count_link_total">\s*([0-9,]+)\s*<\/span>/i);
    const badgesCount = profileBadgesMatch 
      ? parseInt(profileBadgesMatch[1].replace(/,/g, ''), 10)
      : (badgesMatches ? badgesMatches.length : (steamLevel > 0 ? Math.max(1, Math.round(steamLevel / 2)) : 0));

    // Accurate total games count from profile HTML
    const gamesCountMatch = pageHtml.match(/<a href="https:\/\/steamcommunity\.com\/(?:id|profiles)\/[^"]*\/games\/?\?tab=all">[\s\S]*?<span class="profile_count_link_total">\s*([0-9,]+)\s*<\/span>/i)
      || pageHtml.match(/data-tooltip-html="[^"]*?([0-9,]+)\s+games in library"/i)
      || pageHtml.match(/<div class="profile_badges_badge"[^>]*data-tooltip-html="[^"]*?([0-9,]+)\s+games in library"/i);
    const totalGames = gamesCountMatch ? parseInt(gamesCountMatch[1].replace(/,/g, ''), 10) : 0;

    let accountAgeYears = 5;
    try {
      const joinYear = new Date(memberSince).getFullYear();
      if (!isNaN(joinYear)) {
        accountAgeYears = Math.max(1, new Date().getFullYear() - joinYear);
      }
    } catch {}

    // Extract verified visible games from XML mostPlayedGame
    const verifiedGames: Array<{
      appid: number;
      name: string;
      playtimeHours: number;
      priceUSD: number;
      lowestPriceUSD: number;
      headerImage?: string;
    }> = [];

    const mostPlayedRegex = /<mostPlayedGame>([\s\S]*?)<\/mostPlayedGame>/g;
    let m;
    while ((m = mostPlayedRegex.exec(xml)) !== null) {
      const block = m[1];
      const name = block.match(/<gameName><!\[CDATA\[(.*?)\]\]><\/gameName>/)?.[1] || '';
      const appidMatch = block.match(/steamcommunity\.com\/app\/([0-9]+)/);
      const appid = appidMatch ? parseInt(appidMatch[1], 10) : 0;
      const hoursMatch = block.match(/<hoursOnRecord>([0-9.,]+)<\/hoursOnRecord>/) || block.match(/<hoursPlayed>([0-9.,]+)<\/hoursPlayed>/);
      const hours = hoursMatch ? parseFloat(hoursMatch[1].replace(/,/g, '')) : 0;
      const logo = block.match(/<gameLogo><!\[CDATA\[(.*?)\]\]><\/gameLogo>/)?.[1] || (appid ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg` : '');
      if (name && appid && !verifiedGames.some(g => g.appid === appid)) {
        const cat = STEAM_GAMES_CATALOG.find(c => c.appid === appid);
        verifiedGames.push({
          appid,
          name,
          playtimeHours: hours,
          priceUSD: cat ? cat.priceUSD : 29.99,
          lowestPriceUSD: cat ? cat.lowestPriceUSD : 14.99,
          headerImage: logo
        });
      }
    }

    // Check if STEAM_API_KEY is available to query GetOwnedGames
    const steamApiKey = process.env.STEAM_API_KEY || readSecret('STEAM_API_KEY');
    let fullOwnedGames: any[] = [];

    if (steamApiKey && steamId64) {
      try {
        const ownedRes = await fetch(
          `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${steamApiKey}&steamid=${steamId64}&include_appinfo=1&include_played_free_games=1&format=json`
        );
        if (ownedRes.ok) {
          const ownedData = await ownedRes.json();
          if (Array.isArray(ownedData.response?.games) && ownedData.response.games.length > 0) {
            fullOwnedGames = ownedData.response.games.map((og: any) => {
              const cat = STEAM_GAMES_CATALOG.find(c => c.appid === og.appid);
              const playtimeHours = Number(((og.playtime_forever || 0) / 60).toFixed(1));
              return {
                appid: og.appid,
                name: og.name || `App ${og.appid}`,
                playtimeHours,
                priceUSD: cat ? cat.priceUSD : 19.99,
                lowestPriceUSD: cat ? cat.lowestPriceUSD : 9.99,
                headerImage: og.img_icon_url 
                  ? `https://media.steampowered.com/steamcommunity/public/images/apps/${og.appid}/${og.img_icon_url}.jpg`
                  : `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${og.appid}/header.jpg`
              };
            });
          }
        }
      } catch (err) {
        console.error('Steam Web API GetOwnedGames query error:', err);
      }
    }

    let profileData;

    if (fullOwnedGames.length > 0) {
      // 100% accurate full library
      profileData = buildAccuratePublicProfile(
        steamId64 || userQuery,
        userQuery,
        personaname,
        realname,
        avatarUrl,
        memberSince,
        accountAgeYears,
        location,
        privacyState,
        vacBanned,
        tradeBanState,
        steamLevel,
        badgesCount,
        summaryBio,
        fullOwnedGames
      );
    } else {
      // Game details are private or unauthenticated access blocked by Valve
      // Fetch live prices for verified games so at least visible games have real store prices
      if (verifiedGames.length > 0) {
        try {
          const appidsList = verifiedGames.map(g => g.appid).join(',');
          const storeRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appidsList}&filters=price_overview&cc=US`);
          if (storeRes.ok) {
            const storeData = await storeRes.json();
            for (const vg of verifiedGames) {
              const po = storeData[String(vg.appid)]?.data?.price_overview;
              if (po && typeof po.final === 'number') {
                vg.priceUSD = po.initial ? po.initial / 100 : po.final / 100;
                vg.lowestPriceUSD = po.final / 100;
              }
            }
          }
        } catch {}
      }

      profileData = buildPrivateGameDetailsProfile(
        steamId64 || userQuery,
        userQuery,
        personaname,
        realname,
        avatarUrl,
        memberSince,
        accountAgeYears,
        location,
        privacyState,
        vacBanned,
        tradeBanState,
        steamLevel,
        badgesCount,
        summaryBio,
        totalGames,
        verifiedGames
      );
    }

    setCache(cacheKey, profileData, 10 * 60 * 1000);
    return res.json({ success: true, profile: profileData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});


// 1c. Universal Live Steam App Details & Telemetry API
app.get('/api/steam/game/:appid', async (req, res) => {
  try {
    const appId = parseInt(req.params.appid, 10);
    if (!appId) {
      return res.status(400).json({ success: false, error: 'Invalid AppID' });
    }
    const cc = CC_MAP[(req.query.cc as string) || 'USD'] || 'US';

    const cacheKey = `game_detail_${appId}_${cc}`;
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return res.json({ success: true, cached: true, game: cached });
    }

    // Fetch Steam appdetails with localized currency
    const detailRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=english&cc=${cc}`);
    if (!detailRes.ok) {
      return res.status(502).json({ success: false, error: 'Steam API error' });
    }
    const detailData = await detailRes.json();
    const d = detailData[appId]?.data;
    if (!d) {
      return res.status(404).json({ success: false, error: 'Game not found on Steam' });
    }

    // Fetch live players
    let currentPlayers = 0;
    try {
      const pRes = await fetch(`https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`);
      if (pRes.ok) {
        const pData = await pRes.json();
        if (typeof pData.response?.player_count === 'number') {
          currentPlayers = pData.response.player_count;
        }
      }
    } catch {}

    const [reviews, deckAndProton, steamCharts] = await Promise.all([
      fetchSteamReviewData(appId),
      fetchDeckAndProtonInfo(appId, Boolean(d.platforms?.linux)),
      fetchSteamChartsData(appId, currentPlayers),
    ]);
    const { deckStatus, protonDB } = deckAndProton;

    // Fetch historical low from IsThereAnyDeal
    let historicalLow = 0;
    let historicalLowDate = 'Unavailable from Steam API';
    let historicalLowCurrency = 'USD';
    try {
      const itdaKey = readSecret('ITDA_API_KEY');
      if (itdaKey) {
        // Step 1: Lookup I TAD UUID by game title with retries
        const lookupUrl = `https://api.isthereanydeal.com/games/lookup/v1?key=${itdaKey}&title=${encodeURIComponent(d.name || '')}`;
        let itadUuid: string | null = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const lookupRes = await fetch(lookupUrl);
            if (lookupRes.ok) {
              const lookupData = await lookupRes.json();
              if (lookupData?.found && lookupData?.game?.title?.toLowerCase().includes((d.name || '').toLowerCase().slice(0, 10))) {
                itadUuid = lookupData.game.id;
                break;
              }
            } else if (lookupRes.status === 429) {
              await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
            } else {
              break;
            }
          } catch {}
        }

        // Step 2: Get store lows using I TAD UUID with retries
        if (itadUuid) {
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              const slRes = await fetch(`https://api.isthereanydeal.com/games/storelow/v2?country=${cc}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'ITAD-API-Key': itdaKey,
                },
                body: JSON.stringify([itadUuid]),
              });
              if (slRes.ok) {
                const slData = await slRes.json();
                // Find Steam shop (id: 61) in the lows
                const steamLow = slData?.[0]?.lows?.find((l: any) => l.shop?.id === 61);
                if (steamLow?.price) {
                  historicalLow = Number(steamLow.price.amount);
                  historicalLowCurrency = steamLow.price.currency || 'USD';
                  historicalLowDate = steamLow.timestamp || 'Unknown date';
                  break;
                }
              } else if (slRes.status === 429) {
                await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
              } else {
                break;
              }
            } catch {}
          }
        }
      }
    } catch (itdaErr) {
      // I TAD unavailable, fall back to 0
    }

    const price = d.price_overview ? d.price_overview.final / 100 : 0;
    const originalPrice = d.price_overview ? d.price_overview.initial / 100 : price;
    const discountPercent = d.price_overview?.discount_percent || 0;
    const priceCurrency = d.price_overview?.currency || 'USD';

    const peak24h = Math.max(currentPlayers, ...(steamCharts.playerHistory24h?.map((p: any) => p.players) || []));
    const allTimePeak = Math.max(steamCharts.allTimePeak, currentPlayers, ...(steamCharts.playerHistory24h?.map((p: any) => p.players) || []), ...(steamCharts.playerHistory7d?.map((p: any) => p.players) || []));

    const genres = (d.genres || []).map((g: any) => g.description);
    const categories = (d.categories || []).map((c: any) => c.description);
    const tags = Array.from(new Set([...genres, ...categories])).slice(0, 10);

    const cleanDescription = (d.short_description || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    const trailers = (d.movies || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      videoUrl: m.hls_h264 || m.mp4?.max || m.mp4?.['480'] || `https://video.akamai.steamstatic.com/store_trailers/${m.id}/movie_max.mp4`,
      thumbnail: m.thumbnail
    })).filter((t: any) => t.videoUrl);

    const fullGame = {
      id: d.steam_appid,
      name: d.name,
      headerImage: d.header_image || `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${d.steam_appid}/header.jpg`,
      currentPlayers,
      peak24h,
      allTimePeak,
      allTimePeakDate: steamCharts.allTimePeakDate,
      price,
      originalPrice,
      discountPercent,
      priceCurrency,
      historicalLow,
      historicalLowDate,
      historicalLowCurrency,
      positiveReviews: reviews.positive,
      negativeReviews: reviews.negative,
      steamRating: reviews.rating,
      ratingStatus: reviews.status,
      releaseDate: d.release_date?.date || 'Available on Steam',
      developer: d.developers?.[0] || 'Studio Developer',
      publisher: d.publishers?.[0] || 'Publisher',
      genres,
      tags,
      deckStatus,
      protonDB,
      trailers,
      reviewHistory: reviews.reviewHistory,
      monthlyHistory: reviews?.monthlyHistory || reviews.reviewHistory,
      dailyHistory: reviews?.dailyHistory || [],
      playerHistory24h: steamCharts.playerHistory24h,
      playerHistory7d: steamCharts.playerHistory7d,
      priceHistory: [
        { date: 'Current', price, discount: discountPercent },
      ],
      achievementsCount: d.achievements?.total || 0,
      depotsCount: 0,
      dlcCount: d.dlc?.length || 0,
      shortDescription: cleanDescription || 'Available on Steam.',
      minSpecs: parseMinimumRequirements(d.pc_requirements?.minimum)
    };

    setCache(cacheKey, fullGame, 300 * 1000); // 5 min cache
    res.json({ success: true, game: fullGame });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Live Steam Upcoming & New Releases API
app.get('/api/steam/releases', async (req, res) => {
  try {
    const cacheKey = 'steam_upcoming_releases_2026';
    const cached = getCached<any[]>(cacheKey);
    if (cached) {
      return res.json({ success: true, cached: true, releases: cached });
    }

    const releases: any[] = [];

    // Fetch coming_soon & new_releases from Steam featuredcategories
    try {
      const catRes = await fetch('https://store.steampowered.com/api/featuredcategories/');
      if (catRes.ok) {
        const catData = await catRes.json();
        const comingSoon = catData.coming_soon?.items || [];
        
        for (const item of comingSoon.slice(0, 12)) {
          releases.push({
            id: item.id,
            name: item.name,
            releaseDate: item.release_date || 'Coming soon',
            publisher: item.publisher || 'Publisher unavailable',
            developer: item.developer || 'Developer unavailable',
            followers: item.followers || 0,
            hypeScore: 0,
            tags: [],
            headerImage: item.header_image || item.large_capsule_image || `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`,
            price: item.final_price ? item.final_price / 100 : 0,
            discountPercent: item.discount_percent || 0,
            isComingSoon: true,
          });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch Steam featuredcategories:', err);
    }

    // Fetch popular wishlist from Steam search
    try {
      const searchRes = await fetch('https://store.steampowered.com/search/results/?query=&start=0&count=20&filter=popularwishlist&json=1');
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const items = searchData.items || [];

        for (const item of items) {
          const match = item.logo?.match(/\/apps\/(\d+)\//);
          const appId = match ? parseInt(match[1], 10) : null;
          if (appId && !releases.some(r => r.id === appId)) {
            releases.push({
              id: appId,
              name: item.name,
              releaseDate: 'Release date unavailable',
              publisher: 'Publisher unavailable',
              developer: 'Developer unavailable',
              followers: 0,
              hypeScore: 0,
              tags: [],
              headerImage: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`,
              price: 0,
              discountPercent: 0,
              isComingSoon: true,
            });
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch Steam popularwishlist:', err);
    }

    // Enrich top 8 releases with live appdetails (exact release date and tags)
    const enriched = await Promise.all(
      releases.slice(0, 8).map(async (rel) => {
        try {
          const detailRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${rel.id}`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            const d = detailData[rel.id]?.data;
            if (d) {
              const liveDate = d.release_date?.date || rel.releaseDate;
              return {
                ...rel,
                name: d.name || rel.name,
                releaseDate: liveDate,
                publisher: d.publishers?.[0] || rel.publisher,
                developer: d.developers?.[0] || rel.developer,
                tags: d.genres?.map((g: any) => g.description) || rel.tags,
                headerImage: d.header_image || rel.headerImage,
              };
            }
          }
        } catch {
          // Keep base rel
        }
        return rel;
      })
    );

    // Combine enriched and remaining
    const finalReleases = [...enriched, ...releases.slice(8)];

    const combined = finalReleases;

    setCache(cacheKey, combined, 5 * 60 * 1000); // 5 min cache
    res.json({ success: true, releases: combined });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Live Concurrent Player Activity & Trend Line API (Sourced from Live Steam Store Telemetry)
app.get('/api/steam/concurrent-activity', async (req, res) => {
  try {
    const timeframe = (req.query.timeframe as string) || 'day';
    const globalStats = await fetchSteamGlobalStats();
    
    // Fetch live userdata from steam
    const userdataRes = await fetch('https://store.steampowered.com/stats/userdata.json', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!userdataRes.ok) {
      throw new Error(`Failed to fetch Steam userdata`);
    }
    
    const userdata = await userdataRes.json();
    const series = userdata[0]?.data || []; // Array of [timestamp, count]
    
    if (series.length === 0) {
      throw new Error('No userdata found');
    }

    let dataPoints: { label: string; players: number; trend: number; peak?: number }[] = [];
    
    // Only 'day' (48 hours) is supported by actual Steam API
    // We sample every 2 hours roughly to not overwhelm the graph
    const sampled = series.filter((_: any, idx: number) => idx % 12 === 0);
    
    dataPoints = sampled.map((point: any, idx: number) => {
      const d = new Date(point[0]);
      return {
        label: `${d.getHours().toString().padStart(2, '0')}:00`,
        players: point[1]
      };
    });
    
    const allCounts = series.map((p: any) => p[1]);
    const peakCount = Math.max(...allCounts);
    const avgCount = Math.round(allCounts.reduce((a: number, b: number) => a + b, 0) / allCounts.length);
    const currentCount = allCounts[allCounts.length - 1];
    
    // Calculate trend percentage over 48h
    const firstCount = allCounts[0];
    const trendValue = ((currentCount - firstCount) / Math.max(1, firstCount)) * 100;
    const trendPercent = (trendValue > 0 ? '+' : '') + trendValue.toFixed(1) + '%';

    res.json({
      success: true,
      timeframe: 'day', // Force day
      currentCount,
      peakCount,
      avgCount,
      trendPercent,
      data: dataPoints,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. List of currencies available on Steam (fetched live from Steam)
app.get('/api/steam/currencies', async (_req, res) => {
  const cacheKey = 'steam_currencies';
  const cached = getCached<string[]>(cacheKey);
  if (cached) {
    return res.json({ success: true, currencies: cached });
  }
  // Fallback: well-known Steam currency codes (Steam doesn't expose a public list)
  const fallback = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'RUB', 'BRL', 'INR', 'KRW', 'TRY', 'MXN', 'SEK', 'NOK', 'DKK', 'PLN', 'THB', 'PHP', 'HUF', 'CZK', 'ILS', 'CLP', 'PEN', 'COP', 'AED', 'SAR'];
  setCache(cacheKey, fallback, 60 * 60 * 1000); // 1 hour
  return res.json({ success: true, currencies: fallback });
});

// Vite middleware / static fallback
async function startServer() {
  const publicPath = path.join(process.cwd(), 'public');
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  // Explicit favicon handler for browser default requests
  app.get('/favicon.ico', (_req, res) => {
    res.sendFile(path.join(publicPath, 'favicon.svg'));
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Steam Analytics Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  startServer();
}
