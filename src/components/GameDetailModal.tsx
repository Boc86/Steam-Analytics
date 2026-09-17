import { useState, useMemo, useEffect } from 'react';
import HlsVideo from './HlsVideo';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  TrendingUp, 
  DollarSign, 
  Terminal, 
  Layers, 
  Cpu, 
  HardDrive, 
  Flame, 
  Calendar,
  Share2,
  FileText,
  Globe,
  Clock,
  User,
  Gamepad2,
  Sparkles,
  PlayCircle
} from 'lucide-react';
import { 
  ComposedChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Line,
  CartesianGrid
} from 'recharts';
import { ThumbsUp } from 'lucide-react';
import { Currency, SteamGame, ConcurrentTimeframe } from '../types';
import { 
  formatNumber, 
  formatPrice, 
  getProtonTierColor, 
  getDeckStatusBadge 
} from '../utils/formatters';

interface GameDetailModalProps {
  game: SteamGame;
  onClose: () => void;
  currency: Currency;
}

export const GameDetailModal = ({
  game,
  onClose,
  currency,
}: GameDetailModalProps) => {
  const [chartTimeframe, setChartTimeframe] = useState<ConcurrentTimeframe>('day');
  const [reviewTimeframe, setReviewTimeframe] = useState<ConcurrentTimeframe>('month');
  const [copiedAppId, setCopiedAppId] = useState(false);
  const [copiedLaunch, setCopiedLaunch] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'economy' | 'patches' | 'specs'>('overview');
  const [regionalPrices, setRegionalPrices] = useState<any[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [gamePatches, setGamePatches] = useState<any[]>([]);
  const [loadingGamePatches, setLoadingGamePatches] = useState(false);
  const [playingTrailers, setPlayingTrailers] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (activeTab === 'economy' && regionalPrices.length === 0) {
      setLoadingPrices(true);
      fetch(`/api/steam/game/${game.id}/regional-prices`)
        .then(r => r.json())
        .then(d => {
          if (d.success) setRegionalPrices(d.prices);
          setLoadingPrices(false);
        })
        .catch(() => setLoadingPrices(false));
    }
  }, [activeTab, game.id]);

  useEffect(() => {
    if (activeTab === 'patches' && gamePatches.length === 0) {
      setLoadingGamePatches(true);
      fetch(`/api/steam/game/${game.id}/patches`)
        .then(r => r.json())
        .then(d => {
          if (d.success) setGamePatches(d.patches);
          setLoadingGamePatches(false);
        })
        .catch(() => setLoadingGamePatches(false));
    }
  }, [activeTab, game.id]);


  // Determine available review filters based on data range
  const reviewFilterOptions = useMemo(() => {
    if (!game.reviewHistory?.length) return ['month'];

    const dates = game.reviewHistory
      .map(r => new Date(r.date).getTime())
      .filter(t => Number.isFinite(t));

    if (!dates.length) return ['month'];

    const oldest = Math.min(...dates);
    const newest = Math.max(...dates);
    const daysRange = (newest - oldest) / (1000 * 60 * 60 * 24);
    const monthsRange = daysRange / 30;

    // Always include filters that make sense for the data
    const options: ConcurrentTimeframe[] = [];

    // Day/Week only if we have recent daily data (< 30 days)
    if (monthsRange < 1) {
      options.push('day', 'week');
    } else if (monthsRange < 3) {
      options.push('week');
    }

    // Month filter if we have at least 1 month
    if (monthsRange >= 0.5) options.push('month');

    // Year filter if we have at least 12 months
    if (monthsRange >= 12) options.push('year');

    // All time if we have at least 24 months
    if (monthsRange >= 24) options.push('all_time');

    // Fallback
    if (!options.length) options.push('month');

    return options;
  }, [game.reviewHistory]);

  // Ensure reviewTimeframe is valid
  useEffect(() => {
    if (!reviewFilterOptions.includes(reviewTimeframe)) {
      setReviewTimeframe(reviewFilterOptions[0]);
    }
  }, [reviewFilterOptions, reviewTimeframe]);

  const protonColor = getProtonTierColor(game.protonDB.tier);
  const deckBadge = getDeckStatusBadge(game.deckStatus);

  const timeframeData = useMemo(() => {
    let baseList: { label: string; players: number }[] = [];

    if (chartTimeframe === 'day') {
      if (game.playerHistory24h && game.playerHistory24h.length >= 2) {
        // Full rolling 24-hour window
        baseList = game.playerHistory24h.map(p => ({ label: p.time, players: p.players }));
      }
    } else if (chartTimeframe === 'week') {
      if (game.playerHistory7d && game.playerHistory7d.length >= 2) {
        baseList = game.playerHistory7d.map(p => {
          let label = p.time;
          try {
            const d = new Date(p.time);
            if (!isNaN(d.getTime())) {
              label = d.toLocaleDateString(undefined, { weekday: 'short' });
            }
          } catch {}
          return { label, players: p.players };
        });
      }
    } else if (chartTimeframe === 'month' || chartTimeframe === 'year' || chartTimeframe === 'all_time') {
      // We don't have real data for these timeframes from steamcharts for this app
      baseList = [];
    }

    const n = baseList.length;
    let sumY = 0;
    for (let i = 0; i < n; i++) {
      sumY += baseList[i].players;
    }

    const peak = baseList.length > 0 
      ? Math.max(...baseList.map(b => b.players)) 
      : Math.max(game.currentPlayers, game.peak24h || 0);
    const avg = baseList.length > 0 && n > 0 
      ? Math.round(sumY / n) 
      : game.currentPlayers;

    return { data: baseList, peak, avg };
  }, [game, chartTimeframe]);

  const trailers = game.trailers || [];

  const reviewTrendData = useMemo(() => {
    // Use monthlyHistory (30 months of rollups) for month/year/all views
    // Use dailyHistory (last 30 days) for day/week views
    let source: typeof game.reviewHistory = [];
    if (reviewTimeframe === 'day' || reviewTimeframe === 'week') {
      source = game.dailyHistory?.length ? game.dailyHistory : game.reviewHistory;
    } else {
      source = game.monthlyHistory?.length ? game.monthlyHistory : game.reviewHistory;
    }

    const observations = source
      .map((point) => ({ ...point, timestamp: new Date(point.date).getTime() }))
      .filter((point) => Number.isFinite(point.timestamp))
      .sort((a, b) => a.timestamp - b.timestamp);
    if (!observations.length) return [];

    const now = new Date();
    const nowTimestamp = now.getTime();
    const ranges: Record<ConcurrentTimeframe, number> = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
      all_time: Number.POSITIVE_INFINITY,
    };
    const filtered = observations.filter((point) => reviewTimeframe === 'all_time' || point.timestamp >= nowTimestamp - ranges[reviewTimeframe]);

    // Bucketing config matching concurrent players chart pattern
    const bucketingConfigs: Record<ConcurrentTimeframe, { bucketSpanMs: number }> = {
      day: { bucketSpanMs: 3600 * 1000 },        // hourly
      week: { bucketSpanMs: 24 * 3600 * 1000 },  // daily
      month: { bucketSpanMs: 7 * 24 * 3600 * 1000 }, // weekly
      year: { bucketSpanMs: 30 * 24 * 3600 * 1000 }, // monthly
      all_time: { bucketSpanMs: 365 * 24 * 3600 * 1000 }, // yearly
    };
    const { bucketSpanMs } = bucketingConfigs[reviewTimeframe];

    const buckets = new Map<string, { positive: number; negative: number; label: string }>();
    for (const point of filtered) {
      const bucketStart = Math.floor(point.timestamp / bucketSpanMs) * bucketSpanMs;
      const key = String(bucketStart);
      const date = new Date(bucketStart);
      let label: string;
      if (reviewTimeframe === 'day') {
        label = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
      } else if (reviewTimeframe === 'week') {
        label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } else if (reviewTimeframe === 'month') {
        label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } else if (reviewTimeframe === 'year') {
        label = date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      } else {
        label = String(date.getFullYear());
      }

      const bucket = buckets.get(key) || { positive: 0, negative: 0, label };
      bucket.positive += point.positive;
      bucket.negative += point.negative;
      buckets.set(key, bucket);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, bucket]) => ({
        date: bucket.label,
        rating: Math.round((bucket.positive / Math.max(bucket.positive + bucket.negative, 1)) * 100),
        positive: bucket.positive,
        negative: bucket.negative,
      }));
  }, [game.reviewHistory, game.monthlyHistory, game.dailyHistory, reviewTimeframe]);

  const handleCopyAppId = () => {
    navigator.clipboard.writeText(game.id.toString());
    setCopiedAppId(true);
    setTimeout(() => setCopiedAppId(false), 2000);
  };

  const handleCopyLaunch = () => {
    if (game.protonDB.launchOptions) {
      navigator.clipboard.writeText(game.protonDB.launchOptions);
      setCopiedLaunch(true);
      setTimeout(() => setCopiedLaunch(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Bar with Close Button */}
        <div className="sticky top-0 z-20 shrink-0 flex-shrink-0 flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5 font-bold flex-shrink-0">
              <span>AppID: {game.id}</span>
              <button 
                onClick={handleCopyAppId}
                className="hover:text-white transition-colors"
                title="Copy AppID"
              >
                {copiedAppId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white truncate">{game.name}</h2>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs (shrink-0 prevents squashing when Overview or Patch Notes are active) */}
        <div className="shrink-0 flex-shrink-0 min-h-[48px] flex items-center gap-1 px-6 bg-slate-950/80 border-b border-slate-800 overflow-x-auto scrollbar-none">
          <button
            id="modal-tab-overview"
            onClick={() => setActiveTab('overview')}
            className={`shrink-0 flex-shrink-0 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'text-white border-blue-500 bg-blue-500/10'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-blue-400" />
            <span>Overview & Analytics</span>
          </button>

          <button
            id="modal-tab-economy"
            onClick={() => setActiveTab('economy')}
            className={`shrink-0 flex-shrink-0 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 flex items-center gap-2 ${
              activeTab === 'economy'
                ? 'text-white border-emerald-500 bg-emerald-500/10'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Economy & Regional Pricing</span>
            {regionalPrices.length > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                10 REGIONS
              </span>
            )}
          </button>

          <button
            id="modal-tab-patches"
            onClick={() => setActiveTab('patches')}
            className={`shrink-0 flex-shrink-0 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 flex items-center gap-2 ${
              activeTab === 'patches'
                ? 'text-white border-indigo-500 bg-indigo-500/10'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Patch Notes</span>
            <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              VALVE LIVE
            </span>
          </button>

          <button
            id="modal-tab-specs"
            onClick={() => setActiveTab('specs')}
            className={`shrink-0 flex-shrink-0 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 flex items-center gap-2 ${
              activeTab === 'specs'
                ? 'text-white border-purple-500 bg-purple-500/10'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            <span>Specs</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0 text-slate-300 text-sm">
          {activeTab === 'overview' && (
            <div className="space-y-6">
          {/* Top Banner Overview - Bento Box */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg">
            {/* Header Art */}
            <div className="lg:col-span-5 aspect-[460/215] rounded-xl overflow-hidden bg-slate-900 relative shadow-lg border border-slate-800">
              <img
                src={game.headerImage}
                alt={game.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${deckBadge.bg} ${deckBadge.text} ${deckBadge.border}`}>
                  {deckBadge.label}
                </span>
                {game.discountPercent > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-mono font-black">
                    -{game.discountPercent}%
                  </span>
                )}
              </div>
            </div>

            {/* Quick Metadata & Key Metrics */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-3">
                  {game.shortDescription}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block font-bold">Developer</span>
                    <span className="text-slate-200 font-medium truncate block">{game.developer}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block font-bold">Publisher</span>
                    <span className="text-slate-200 font-medium truncate block">{game.publisher}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block font-bold">Release Date</span>
                    <span className="text-slate-200 font-medium">{game.releaseDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block font-bold">Steam Rating</span>
                    <span className="text-emerald-400 font-mono font-bold">{game.steamRating}% ({game.ratingStatus})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block font-bold">Store Price</span>
                    <span className="text-white font-mono font-bold">{formatPrice(game.price, currency)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block font-bold">Historical Low</span>
                    <span className="text-amber-400 font-mono font-bold">
                      {game.historicalLow > 0 ? formatPrice(game.historicalLow, game.priceCurrency) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* External Direct Links */}
              <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-slate-800 text-xs">
                <a
                  href={`https://store.steampowered.com/app/${game.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  <span>Steam Store</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <a
                  href={game.protonDB.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-full bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-white font-bold border border-blue-500/30 transition-all flex items-center gap-1.5"
                >
                  <span>ProtonDB</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <a
                  href={`https://steamcommunity.com/app/${game.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium border border-slate-800 transition-all flex items-center gap-1.5 ml-auto"
                >
                  <span>Community Hub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Concurrent Player Charts Card - Bento Panel */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-blue-400 text-xs font-mono font-bold uppercase tracking-widest">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Concurrent Players Analytics & Trend</span>
                </div>
                <div className="flex items-baseline gap-3 mt-1 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {formatNumber(game.currentPlayers)}
                  </span>
                  <span className="text-xs text-emerald-400 font-medium">in-game now</span>
                  <span className="text-xs text-slate-400">
                    • 24h Peak: <strong className="text-slate-200 font-mono">{formatNumber(game.peak24h)}</strong>
                  </span>
                  <span className="text-xs text-slate-400">
                    • All-time Peak: <strong className="text-slate-200 font-mono">{formatNumber(game.allTimePeak)}</strong>
                  </span>
                </div>
              </div>

              {/* Timeframe selector: day, week, month, year, all_time */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto flex-wrap">
                {(['day', 'week', 'month', 'year', 'all_time'] as ConcurrentTimeframe[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setChartTimeframe(tf)}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold capitalize transition-colors ${
                      chartTimeframe === tf
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf === 'all_time' ? 'All Time' : tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics Breakdown for Current Timeframe */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-xs font-mono">
              <div>
                <div className="text-slate-500 uppercase text-[10px]">Actual Current</div>
                <div className="text-blue-400 font-bold text-sm sm:text-base mt-0.5">{formatNumber(game.currentPlayers)}</div>
              </div>
              <div>
                <div className="text-slate-500 uppercase text-[10px]">Timeframe Peak</div>
                <div className="text-slate-200 font-bold text-sm sm:text-base mt-0.5">{formatNumber(timeframeData.peak)}</div>
              </div>
              <div>
                <div className="text-slate-500 uppercase text-[10px]">Timeframe Average</div>
                <div className="text-slate-200 font-bold text-sm sm:text-base mt-0.5">{formatNumber(timeframeData.avg)}</div>
              </div>
              <div>
                <div className="text-slate-500 uppercase text-[10px]">Historical Record</div>
                <div className="text-amber-400 font-bold text-sm sm:text-base mt-0.5">{formatNumber(game.allTimePeak)}</div>
                {game.allTimePeakDate !== 'Unavailable' && <div className="text-[10px] text-slate-500">{game.allTimePeakDate}</div>}
              </div>
            </div>

            {/* Recharts Area + Trend Line Graph */}
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                <ComposedChart data={timeframeData.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="playerGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#334155' }}
                    tickFormatter={(v) => formatNumber(v)}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#020617', 
                      borderColor: '#334155', 
                      borderRadius: '16px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                    formatter={(val: number, name: string) => [
                      `${formatNumber(val)} players`, 
                      name === 'players' ? 'Actual Count' : name
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="players" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#playerGradient)" 
                    name="players"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-blue-400">
                  <span className="w-2.5 h-1 bg-blue-500 rounded-full inline-block"></span>
                  Player Count
                </span>
              </div>
              <span>Live Steam Graph Synchronized</span>
            </div>
          </div>

          {/* Steam review trend */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-widest">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Steam Review Trend</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Positive-review share from Steam observations in the selected timeframe.</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-slate-400 font-mono">{game.steamRating}% current</span>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
                  {reviewFilterOptions.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setReviewTimeframe(tf)}
                      className={`px-2 py-0.5 rounded-xl text-[10px] font-mono font-bold capitalize transition-colors ${
                        reviewTimeframe === tf
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tf === 'all_time' ? 'All' : tf}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {reviewTrendData.length > 0 ? (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={reviewTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value: number) => [`${value}% positive`, 'Steam sentiment']} />
                    <Area type="monotone" dataKey="rating" stroke="#10b981" fill="#10b981" fillOpacity={0.15} name="rating" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">Steam has not returned review observations for this timeframe.</div>
            )}
          </div>

          {/* ProtonDB compatibility details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PROTONDB COMPATIBILITY SECTION */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between shadow-md">
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-400" />
                    <h3 className="font-bold text-white text-base">ProtonDB Linux Report</h3>
                  </div>
                  <div className={`px-3 py-1 rounded-full border font-mono font-black text-xs uppercase tracking-wider ${protonColor.bg} ${protonColor.text} ${protonColor.border}`}>
                    {game.protonDB.tier}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs mb-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">Confidence</span>
                    <span className="text-slate-200 font-medium">{game.protonDB.confidence}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">Reports</span>
                    <span className="text-blue-400 font-mono font-bold">{formatNumber(game.protonDB.totalReports)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs mt-auto">
                <span className="text-slate-500 font-mono text-[11px]">Crowdsourced via ProtonDB</span>
                <a
                  href={game.protonDB.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  <span>Open Full ProtonDB Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Game Trailers Section */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <h3 className="font-bold text-white text-base">Media & Trailers</h3>
              </div>
              
              {trailers.length > 0 ? (
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '240px' }}>
                  {trailers.map((trailer) => (
                    <div key={trailer.id} className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-md">
                      <div className="w-full aspect-video bg-black relative flex items-center justify-center group">
                        {playingTrailers[trailer.id] ? (
                          <HlsVideo 
                            src={trailer.videoUrl}
                            poster={trailer.thumbnail}
                            autoPlay={true}
                            controls={true}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <>
                            <img 
                              src={trailer.thumbnail} 
                              alt={trailer.name}
                              className="w-full h-full object-cover opacity-70 group-hover:opacity-50 transition-opacity cursor-pointer"
                              onClick={() => setPlayingTrailers(prev => ({ ...prev, [trailer.id]: true }))}
                            />
                            <div 
                              className="absolute inset-0 flex items-center justify-center cursor-pointer pointer-events-none"
                            >
                              <PlayCircle className="w-12 h-12 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all drop-shadow-lg shadow-black" />
                            </div>
                          </>
                        )}
                      </div>
                      <div className="p-2.5 text-xs font-medium text-slate-300 truncate">
                        {trailer.name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[120px] text-slate-500 text-xs">
                  <p>No trailers available</p>
                </div>
              )}
            </div>

          </div>

          {/* System Specs & Technical Requirements */}
          {game.minSpecs && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-md">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400 uppercase tracking-widest mb-3">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>System Requirements & Hardware Targets</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-mono block font-bold">OS</span>
                  <span className="text-slate-200 font-medium">{game.minSpecs.os}</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-mono block font-bold">Processor</span>
                  <span className="text-slate-200 font-medium">{game.minSpecs.processor}</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-mono block font-bold">Graphics</span>
                  <span className="text-slate-200 font-medium">{game.minSpecs.graphics}</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-mono block font-bold">Storage</span>
                  <span className="text-slate-200 font-medium">{game.minSpecs.storage}</span>
                </div>
              </div>
            </div>
          )}
            </div>
          )}

          {/* Economy & Regional Pricing Tab */}
          {activeTab === 'economy' && (
            <div className="space-y-6">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-md">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Live Regional Price Matrix</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Direct price queries across 10 official Steam regional currency stores.
                    </p>
                  </div>

                  <div className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    Base Store Price: <strong className="text-white">{formatPrice(game.price, currency)}</strong>
                  </div>
                </div>

                {loadingPrices ? (
                  <div className="py-16 flex flex-col items-center justify-center space-y-3">
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                    <span className="text-xs font-mono text-slate-400">Querying Steam regional store endpoints...</span>
                  </div>
                ) : regionalPrices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                          <th className="py-3 px-4">Region</th>
                          <th className="py-3 px-4">Currency</th>
                          <th className="py-3 px-4 text-right">Current Price</th>
                          <th className="py-3 px-4 text-right">Price Value</th>
                          <th className="py-3 px-4 text-center">Store Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {regionalPrices.map((p, idx) => {
                          const isEu = p.region?.toLowerCase().includes('european union');
                          const displayCurrency = isEu ? 'EUR' : p.currencyCode;
                          let displayPrice = p.priceFormatted;
                          if (isEu && (displayPrice.includes('$') || !displayPrice.includes('€'))) {
                            displayPrice = `${p.priceRaw.toFixed(2).replace('.', ',')}€`;
                          }
                          return (
                            <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                              <td className="py-3 px-4 font-bold text-white font-sans">{p.region}</td>
                              <td className="py-3 px-4 text-slate-400">{displayCurrency}</td>
                              <td className="py-3 px-4 text-right font-bold text-emerald-400">{displayPrice}</td>
                              <td className="py-3 px-4 text-right text-slate-300">{p.priceRaw.toFixed(2)}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                  Available
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-500 font-mono">
                    This item is either free-to-play, a package bundle, or regional pricing is currently restricted by Valve.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Patch Notes & Updates Tab */}
          {activeTab === 'patches' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Developer Changelog History</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">Live via Valve News API</span>
              </div>

              {loadingGamePatches ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <span className="text-xs font-mono text-slate-400">Fetching official Steam announcements...</span>
                </div>
              ) : gamePatches.length > 0 ? (
                gamePatches.map((patch) => (
                  <div key={patch.gid} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="font-bold text-white text-base font-sans">{patch.title}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {new Date(patch.date * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        {patch.url && (
                          <a
                            href={patch.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-500/30 flex items-center gap-1 transition-colors"
                          >
                            <span>Steam Post</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                      {patch.contents.length > 500 ? `${patch.contents.slice(0, 500)}...` : patch.contents}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                      <span>Author: {patch.author}</span>
                      <span>•</span>
                      <span>Source: {patch.feedlabel}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-slate-500">
                  No public patch notes returned by the Steam News API for this AppID.
                </div>
              )}
            </div>
          )}

          {/* Specifications Tab */}
          {activeTab === 'specs' && (
            <div className="space-y-6">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-md space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Hardware & System Specifications</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">App Type</span>
                    <span className="text-white font-medium mt-1 block">Game / Application</span>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">Developer</span>
                    <span className="text-white font-medium mt-1 block">{game.developer || 'Valve / Partner'}</span>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">Publisher</span>
                    <span className="text-white font-medium mt-1 block">{game.publisher || 'Valve'}</span>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">Release Date</span>
                    <span className="text-white font-medium mt-1 block">{game.releaseDate || 'Available'}</span>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">Steam Deck</span>
                    <span className={`${deckBadge.text} font-medium mt-1 block`}>{deckBadge.label}</span>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">Proton Tier</span>
                    <span className="text-blue-400 font-medium mt-1 block">{game.protonDB.tier.toUpperCase()}</span>
                  </div>
                </div>

                {game.minSpecs && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                    <h5 className="font-bold text-white text-xs uppercase tracking-wider font-mono">Minimum System Requirements</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <strong className="text-slate-400 block font-mono text-[10px]">OS</strong>
                        <span className="text-slate-200">{game.minSpecs.os}</span>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <strong className="text-slate-400 block font-mono text-[10px]">Processor</strong>
                        <span className="text-slate-200">{game.minSpecs.processor}</span>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <strong className="text-slate-400 block font-mono text-[10px]">Graphics</strong>
                        <span className="text-slate-200">{game.minSpecs.graphics}</span>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <strong className="text-slate-400 block font-mono text-[10px]">Storage</strong>
                        <span className="text-slate-200">{game.minSpecs.storage}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
