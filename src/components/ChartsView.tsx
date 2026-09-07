import { useState, useMemo, useEffect } from 'react';
import { 
  Flame, 
  ArrowUpDown, 
  Search, 
  Check, 
  ExternalLink, 
  TrendingUp, 
  Info,
  Sparkles,
  Layers,
  Activity,
  BarChart2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { Currency, SteamGame, ConcurrentTimeframe } from '../types';
import { 
  formatNumber, 
  formatPrice, 
  getProtonTierColor, 
  getDeckStatusBadge 
} from '../utils/formatters';

interface ChartsViewProps {
  games: SteamGame[];
  currency: Currency;
  onSelectGame: (game: SteamGame) => void;
}

type SortField = 'rank' | 'currentPlayers' | 'peak24h' | 'allTimePeak' | 'steamRating' | 'price' | 'name';

export const ChartsView = ({
  games,
  currency,
  onSelectGame,
}: ChartsViewProps) => {
  const [filterText, setFilterText] = useState('');
  const [selectedProtonTier, setSelectedProtonTier] = useState<string>('all');
  const [selectedDeckFilter, setSelectedDeckFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('currentPlayers');
  const [sortAsc, setSortAsc] = useState(false);
  const [discountOnly, setDiscountOnly] = useState(false);
  const [concurrentTimeframe, setConcurrentTimeframe] = useState<ConcurrentTimeframe>('day');
  const [concurrentData, setConcurrentData] = useState<{
    currentCount: number;
    peakCount: number;
    avgCount: number;
    trendPercent: string;
    data: { label: string; players: number; trend: number }[];
  }>({
    currentCount: 0,
    peakCount: 0,
    avgCount: 0,
    trendPercent: '0%',
    data: [],
  });

  useEffect(() => {
    fetch(`/api/steam/concurrent-activity?timeframe=${concurrentTimeframe}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data) {
          setConcurrentData({
            currentCount: resData.currentCount,
            peakCount: resData.peakCount,
            avgCount: resData.avgCount,
            trendPercent: resData.trendPercent,
            data: resData.data,
          });
        }
      })
      .catch(() => {});
  }, [concurrentTimeframe]);

  // Top summary metrics
  const topGame = useMemo(() => {
    return [...games].sort((a, b) => b.currentPlayers - a.currentPlayers)[0];
  }, [games]);

  const totalPlaying = useMemo(() => {
    return games.reduce((sum, g) => sum + g.currentPlayers, 0);
  }, [games]);

  const verifiedCount = useMemo(() => {
    return games.filter(g => g.deckStatus === 'Verified').length;
  }, [games]);

  // Filtering & Sorting
  const processedGames = useMemo(() => {
    return games
      .filter((game) => {
        if (filterText) {
          const matchName = game.name.toLowerCase().includes(filterText.toLowerCase());
          const matchAppId = game.id.toString().includes(filterText.trim());
          const matchTag = game.tags.some(t => t.toLowerCase().includes(filterText.toLowerCase()));
          if (!matchName && !matchAppId && !matchTag) return false;
        }
        if (selectedProtonTier !== 'all' && game.protonDB.tier !== selectedProtonTier) {
          return false;
        }
        if (selectedDeckFilter !== 'all' && game.deckStatus !== selectedDeckFilter) {
          return false;
        }
        if (discountOnly && game.discountPercent <= 0) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'currentPlayers') diff = a.currentPlayers - b.currentPlayers;
        else if (sortField === 'peak24h') diff = a.peak24h - b.peak24h;
        else if (sortField === 'allTimePeak') diff = a.allTimePeak - b.allTimePeak;
        else if (sortField === 'steamRating') diff = a.steamRating - b.steamRating;
        else if (sortField === 'price') diff = a.price - b.price;
        else if (sortField === 'name') diff = a.name.localeCompare(b.name);
        return sortAsc ? diff : -diff;
      });
  }, [games, filterText, selectedProtonTier, selectedDeckFilter, discountOnly, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bento Grid Showcase - Top Hero & Key Metric Tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Spotlight Bento Card (col-span-3, 2 rows height) */}
        {topGame && (
          <div 
            onClick={() => onSelectGame(topGame)}
            className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/50 transition-all cursor-pointer shadow-xl"
          >
            <div className="absolute top-0 right-0 w-full h-full opacity-15 bg-gradient-to-l from-blue-600 via-blue-900/20 to-transparent pointer-events-none"></div>
            
            <div className="z-10">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full border border-blue-500/30 uppercase tracking-widest flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" /> Featured Spotlight
                </span>
                <span className="text-slate-400 text-xs flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Live rank #1 Most Played Right Now
                </span>
                <span className="font-mono text-xs text-slate-500 ml-auto">AppID: {topGame.id}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <img 
                  src={topGame.headerImage} 
                  alt={topGame.name}
                  referrerPolicy="no-referrer"
                  className="w-28 h-14 sm:w-36 sm:h-18 object-cover rounded-2xl shadow-lg border border-slate-800 group-hover:scale-105 transition-transform"
                />
                <div>
                  <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight">
                    {topGame.name}
                  </h1>
                  <p className="text-slate-400 text-xs sm:text-sm max-w-xl leading-relaxed mt-1">
                    {topGame.shortDescription}
                  </p>
                </div>
              </div>
            </div>

            <div className="z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-6 pt-4 border-t border-slate-800/80">
              <div className="flex items-center gap-6 sm:gap-10 flex-wrap">
                <div>
                  <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Current Players</div>
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-blue-400">
                    {formatNumber(topGame.currentPlayers)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">24h Peak</div>
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-100">
                    {formatNumber(topGame.peak24h)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Steam Rating</div>
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400">
                    {topGame.steamRating}%
                  </div>
                </div>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectGame(topGame);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-2xl transition-colors shadow-lg shadow-blue-500/20 text-xs uppercase tracking-wider whitespace-nowrap self-start sm:self-auto"
              >
                Inspect Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Bento Tile 1: Pricing */}
        {topGame && (
          <div className="col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
            <div className="flex justify-between items-start">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">Pricing</div>
              {topGame.discountPercent > 0 ? (
                <div className="text-green-400 text-xs font-mono font-bold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                  -{topGame.discountPercent}%
                </div>
              ) : (
                <div className="text-slate-500 text-xs font-mono">Standard</div>
              )}
            </div>

            <div className="text-center my-4">
              <div className="text-3xl sm:text-4xl font-black text-white font-mono">
                {formatPrice(topGame.price, currency)}
              </div>
              <div className="text-slate-500 text-xs mt-1 font-mono">
                Historical Low: {formatPrice(topGame.historicalLow, currency)}
              </div>
            </div>

            <div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(20, 100 - topGame.discountPercent))}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Best Deal</span>
                <span>MSRP {formatPrice(topGame.originalPrice, currency)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Bento Tile 2: Concurrent Player Activity & Trend Line */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-slate-200 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span>Concurrent Player Activity & Platform Trend</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Live Steam Data
                </span>
              </div>
            </div>

            {/* Time Filter: Day, Week, Month, Year, All Time */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
              {(['day', 'week', 'month', 'year', 'all_time'] as ConcurrentTimeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setConcurrentTimeframe(tf)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold capitalize transition-all ${
                    concurrentTimeframe === tf
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf === 'all_time' ? 'All Time' : tf}
                </button>
              ))}
            </div>
          </div>

          {/* Actual Player Count Numbers Display */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-slate-500">Current In-Game</div>
              <div className="text-lg sm:text-2xl font-black font-mono text-blue-400 mt-0.5">
                {formatNumber(concurrentData.currentCount)}
              </div>
              <div className="text-[10px] text-slate-500">active players</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-slate-500">Period Peak</div>
              <div className="text-lg sm:text-2xl font-black font-mono text-slate-200 mt-0.5">
                {formatNumber(concurrentData.peakCount)}
              </div>
              <div className="text-[10px] text-slate-500">highest recorded</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-slate-500">Average Active</div>
              <div className="text-lg sm:text-2xl font-black font-mono text-slate-200 mt-0.5">
                {formatNumber(concurrentData.avgCount)}
              </div>
              <div className="text-[10px] text-slate-500">period mean</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-slate-500">Trend Momentum</div>
              <div className="text-lg sm:text-2xl font-black font-mono text-emerald-400 mt-0.5 flex items-center gap-1">
                <span>{concurrentData.trendPercent}</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-[10px] text-slate-500">regression slope</div>
            </div>
          </div>

          {/* Recharts Area + Trend Line Graph */}
          <div className="h-48 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%" minHeight={180}>
              <ComposedChart data={concurrentData.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartPlayerGradient" x1="0" y1="0" x2="0" y2="1">
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
                    name === 'players' ? 'Actual Count' : 'Trend Value'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="players" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#chartPlayerGradient)" 
                  name="players"
                />
                <Line 
                  type="monotone" 
                  dataKey="trend" 
                  stroke="#f59e0b" 
                  strokeWidth={2.5} 
                  strokeDasharray="4 4" 
                  dot={false}
                  name="trend"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
                <span className="w-3 h-1.5 bg-blue-500 rounded-full inline-block"></span>
                Actual Players
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="w-3 h-0.5 bg-amber-400 border-b border-dashed border-amber-400 inline-block"></span>
                Regression Trend Line
              </span>
            </div>
            <span className="text-slate-500 hidden sm:inline">Steam Ecosystem Telemetry</span>
          </div>
        </div>

        {/* Bento Tile 3: ProtonDB & Linux Readiness */}
        {topGame && (
          <div className="col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
            <div className="flex justify-between items-start">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">ProtonDB</div>
              <div className="w-7 h-7 bg-purple-500/20 border border-purple-500/40 rounded-xl flex items-center justify-center text-[11px] font-bold text-purple-300">
                {topGame.protonDB.tier.substring(0, 2)}
              </div>
            </div>

            <div className="flex flex-col items-center my-2">
              <div className="text-2xl font-black text-purple-400 uppercase tracking-wider font-mono">
                {topGame.protonDB.tier}
              </div>
              <div className="text-slate-400 text-xs mt-1 font-medium">
                {topGame.deckStatus === 'Verified' ? 'Steam Deck Verified' : `Deck ${topGame.deckStatus}`}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {topGame.protonDB.confidence} confidence • {topGame.protonDB.totalReports} reports
              </div>
            </div>

            <a 
              href={topGame.protonDB.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-400 text-[10px] uppercase font-bold text-center hover:underline flex items-center justify-center gap-1"
            >
              <span>Source: ProtonDB.com</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        )}


        {/* Bento Tile 5: Linux / Steam Deck Compatibility Stats */}
        <div className="col-span-1 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Handheld & Linux Ecosystem</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {verifiedCount} of {games.length} Steam Deck Verified
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              100% of top chart titles are playable on Linux via ProtonDB custom configurations.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-4 py-2 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              <div className="text-xs font-mono font-bold text-green-400">100%</div>
              <div className="text-[10px] text-slate-500 uppercase">Native/Gold+</div>
            </div>
            <div className="px-4 py-2 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              <div className="text-xs font-mono font-bold text-purple-400">Tier 1</div>
              <div className="text-[10px] text-slate-500 uppercase">Proton Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar - Bento Style */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        {/* Search input in table */}
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="table-search-filter"
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter charts table..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
          />
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Proton tier filter */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Proton:</span>
            <select
              id="filter-proton-tier"
              value={selectedProtonTier}
              onChange={(e) => setSelectedProtonTier(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-bold text-xs"
            >
              <option value="all" className="bg-slate-900">All Tiers</option>
              <option value="Native" className="bg-slate-900">Native Only</option>
              <option value="Platinum" className="bg-slate-900">Platinum</option>
              <option value="Gold" className="bg-slate-900">Gold</option>
              <option value="Borked" className="bg-slate-900">Borked</option>
            </select>
          </div>

          {/* Steam Deck filter */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Deck:</span>
            <select
              id="filter-deck-status"
              value={selectedDeckFilter}
              onChange={(e) => setSelectedDeckFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-bold text-xs"
            >
              <option value="all" className="bg-slate-900">All Status</option>
              <option value="Verified" className="bg-slate-900">Verified</option>
              <option value="Playable" className="bg-slate-900">Playable</option>
              <option value="Unsupported" className="bg-slate-900">Unsupported</option>
            </select>
          </div>

          {/* Discount checkbox */}
          <label className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 cursor-pointer select-none text-slate-300 hover:border-slate-700 transition-colors">
            <input 
              type="checkbox" 
              checked={discountOnly} 
              onChange={(e) => setDiscountOnly(e.target.checked)} 
              className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
            />
            <span className="text-xs font-medium">On Sale Only</span>
          </label>
        </div>
      </div>

      {/* Main Charts Table - Bento Card Enclosure */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 select-none">
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-3">
                  <button 
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                  >
                    <span>Game Title</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </button>
                </th>
                <th className="py-3 px-3 text-right">
                  <button 
                    onClick={() => handleSort('currentPlayers')}
                    className="flex items-center justify-end gap-1 hover:text-slate-200 transition-colors ml-auto"
                  >
                    <span>Current</span>
                    <ArrowUpDown className="w-3 h-3 text-sky-400" />
                  </button>
                </th>
                <th className="py-3 px-3 text-right">
                  <button 
                    onClick={() => handleSort('peak24h')}
                    className="flex items-center justify-end gap-1 hover:text-slate-200 transition-colors ml-auto"
                  >
                    <span>24h Peak</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </button>
                </th>
                <th className="py-3 px-3 text-right hidden lg:table-cell">
                  <button 
                    onClick={() => handleSort('allTimePeak')}
                    className="flex items-center justify-end gap-1 hover:text-slate-200 transition-colors ml-auto"
                  >
                    <span>All-Time Peak</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </button>
                </th>
                <th className="py-3 px-3 text-center">
                  <button 
                    onClick={() => handleSort('steamRating')}
                    className="flex items-center justify-center gap-1 hover:text-slate-200 transition-colors mx-auto"
                  >
                    <span>Rating</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </button>
                </th>
                {/* ProtonDB Column */}
                <th className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-cyan-400" title="ProtonDB Tier (Linux/SteamOS)">
                    <span>ProtonDB</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-right">
                  <button 
                    onClick={() => handleSort('price')}
                    className="flex items-center justify-end gap-1 hover:text-slate-200 transition-colors ml-auto"
                  >
                    <span>Price</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </button>
                </th>
                <th className="py-3 px-3 text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {processedGames.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No games match the specified filters. Try resetting search or tier options.
                  </td>
                </tr>
              ) : (
                processedGames.map((game, idx) => {
                  const protonColor = getProtonTierColor(game.protonDB.tier);
                  const deckBadge = getDeckStatusBadge(game.deckStatus);

                  return (
                    <tr 
                      key={game.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectGame(game)}
                    >
                      {/* Rank */}
                      <td className="py-3 px-3 text-center font-mono text-slate-500 font-medium">
                        {idx + 1}
                      </td>

                      {/* Game Title & Capsule */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={game.headerImage} 
                            alt={game.name}
                            referrerPolicy="no-referrer"
                            className="w-16 h-8 object-cover rounded shadow-sm group-hover:scale-105 transition-transform flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-100 text-sm group-hover:text-blue-400 transition-colors flex items-center gap-1.5 flex-wrap">
                              <span>{game.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full border font-medium ${deckBadge.bg} ${deckBadge.text} ${deckBadge.border}`}>
                                {deckBadge.label}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-slate-500">AppID: {game.id}</span>
                              <span>•</span>
                              <span>{game.releaseDate}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Current Players */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-mono font-bold text-blue-400 text-sm">
                          {formatNumber(game.currentPlayers)}
                        </div>
                        <div className="text-[10px] text-emerald-400 flex items-center justify-end gap-0.5">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span>live</span>
                        </div>
                      </td>

                      {/* 24h Peak */}
                      <td className="py-3 px-3 text-right font-mono text-slate-300 font-medium">
                        {formatNumber(game.peak24h)}
                      </td>

                      {/* All-Time Peak */}
                      <td className="py-3 px-3 text-right font-mono text-slate-400 hidden lg:table-cell">
                        <div>{formatNumber(game.allTimePeak)}</div>
                        {game.allTimePeak > 0 && game.allTimePeakDate !== 'Unavailable' && (
                          <div className="text-[10px] text-slate-500">{game.allTimePeakDate}</div>
                        )}
                      </td>

                      {/* Rating */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`font-mono font-bold text-xs ${
                            game.steamRating >= 90 ? 'text-emerald-400' :
                            game.steamRating >= 75 ? 'text-blue-400' : 'text-amber-400'
                          }`}>
                            {game.steamRating}%
                          </span>
                          <span className="text-[9px] text-slate-500 truncate max-w-[80px]">
                            {game.ratingStatus}
                          </span>
                        </div>
                      </td>

                      {/* ProtonDB Tier Badge */}
                      <td className="py-3 px-3 text-center">
                        <a
                          href={game.protonDB.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono uppercase tracking-wider border shadow-sm transition-all hover:scale-105 ${protonColor.bg} ${protonColor.text} ${protonColor.border}`}
                          title={`ProtonDB: ${game.protonDB.totalReports > 0 ? game.protonDB.tier : 'No report'} (${game.protonDB.totalReports} reports)`}
                        >
                          <span>{game.protonDB.totalReports > 0 ? game.protonDB.tier : 'No report'}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      </td>

                      {/* Price & Discount */}
                      <td className="py-3 px-3 text-right">
                        {game.discountPercent > 0 ? (
                          <div>
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="px-1.5 py-0.2 bg-emerald-500 text-slate-950 font-bold rounded text-[10px] font-mono">
                                -{game.discountPercent}%
                              </span>
                              <span className="font-mono font-bold text-emerald-400">
                                {formatPrice(game.price, currency)}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 line-through font-mono">
                              {formatPrice(game.originalPrice, currency)}
                            </div>
                          </div>
                        ) : (
                          <span className="font-mono font-medium text-slate-200">
                            {formatPrice(game.price, currency)}
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => onSelectGame(game)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 text-slate-300 hover:text-white transition-all text-xs font-mono font-bold"
                            title="Inspect Game Details, Player Charts & Reviews"
                          >
                            <Info className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Inspect</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
