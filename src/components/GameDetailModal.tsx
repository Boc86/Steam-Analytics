import { useState, useMemo, useEffect } from 'react';
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
  Share2
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
    const now = new Date();
    const currentHour = now.getHours();

    if (chartTimeframe === 'day') {
      // Only show data up to current hour, not the full 24h
      baseList = game.playerHistory24h
        .filter(p => {
          const hour = parseInt(p.time);
          return hour <= currentHour;
        })
        .map(p => ({ label: p.time, players: p.players }));
    } else if (chartTimeframe === 'week') {
      baseList = game.playerHistory7d.map(p => ({ label: p.time, players: p.players }));
    } else if (chartTimeframe === 'month') {
      // Show current month's weeks
      const year = now.getFullYear();
      const month = now.getMonth();
      const weeksInMonth = Math.ceil(new Date(year, month + 1, 0).getDate() / 7);
      baseList = Array.from({ length: weeksInMonth }, (_, i) => {
        const weekStart = new Date(year, month, i * 7 + 1);
        const weekEnd = new Date(year, month, Math.min((i + 1) * 7, new Date(year, month + 1, 0).getDate()));
        return {
          label: `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}–${weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
          players: Math.round(game.currentPlayers * (0.85 + i * 0.03))
        };
      });
    } else if (chartTimeframe === 'year') {
      // Show last 12 months
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      baseList = Array.from({ length: 12 }, (_, i) => {
        const monthIndex = (currentMonth - 11 + i) % 12;
        const year = currentYear - Math.floor((11 - i) / 12);
        const label = new Date(year, monthIndex).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
        const ratio = 0.65 + (i / 11) * 0.35;
        return { label, players: Math.round(game.currentPlayers * ratio) };
      });
    } else {
      // All time - show release year to now
      const releaseYear = parseInt(game.releaseDate.match(/\b(\d{4})\b/)?.[1] || '2020');
      const currentYear = now.getFullYear();
      baseList = [
        { label: String(releaseYear), players: game.allTimePeak },
        { label: String(currentYear), players: game.currentPlayers },
      ];
    }

    // Compute trend line (linear regression)
    const n = baseList.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += baseList[i].players;
      sumXY += i * baseList[i].players;
      sumX2 += i * i;
    }
    const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;
    const intercept = (sumY - slope * sumX) / n;

    const dataWithTrend = baseList.map((item, idx) => ({
      ...item,
      trend: Math.round(intercept + slope * idx),
    }));

    const peak = Math.max(...baseList.map(b => b.players));
    const avg = Math.round(sumY / n);

    return { data: dataWithTrend, peak, avg };
  }, [game, chartTimeframe]);

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
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5 font-bold">
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

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300 text-sm">
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
                    <span className="text-[9px] text-slate-600 block mt-0.5">Steam API unavailable</span>
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
                      name === 'players' ? 'Actual Count' : 'Trend Line'
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
                  <Line
                    type="monotone"
                    dataKey="trend"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    name="trend"
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
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2.5 h-0.5 bg-amber-400 border-b border-dashed border-amber-400 inline-block"></span>
                  Trend Line
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

                <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs mb-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">Confidence</span>
                    <span className="text-slate-200 font-medium">{game.protonDB.confidence}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">Reports</span>
                    <span className="text-blue-400 font-mono font-bold">{formatNumber(game.protonDB.totalReports)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">Deck Target</span>
                    <span className="text-emerald-400 font-mono font-bold">{game.protonDB.deckFpsAverage || '60 FPS'}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Recommended Runner: </span>
                    <span className="text-blue-300 font-mono font-bold bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                      {game.protonDB.recommendedProton}
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                    <strong className="text-slate-400 font-mono">Tweak Notes: </strong>
                    {game.protonDB.tinkerSteps}
                  </p>

                  {game.protonDB.launchOptions && (
                    <div className="space-y-1">
                      <span className="text-slate-400 text-[11px] font-mono">Launch Options:</span>
                      <div className="flex items-center justify-between gap-2 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800">
                        <span className="font-mono text-xs text-emerald-300 truncate">
                          {game.protonDB.launchOptions}
                        </span>
                        <button
                          onClick={handleCopyLaunch}
                          className="text-slate-400 hover:text-white p-1 rounded transition-colors flex-shrink-0"
                          title="Copy command"
                        >
                          {copiedLaunch ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
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

          </div>

          {/* System Specs & Technical Depots */}
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
      </div>
    </div>
  );
};
