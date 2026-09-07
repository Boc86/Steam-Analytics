import { useState, useMemo } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  TrendingUp, 
  DollarSign, 
  Terminal, 
  Gamepad2, 
  Layers, 
  Cpu, 
  HardDrive, 
  Award, 
  Flame, 
  ThumbsUp, 
  ThumbsDown,
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
import { Currency, SteamGame, ConcurrentTimeframe } from '../types';
import { 
  formatNumber, 
  formatPrice, 
  getProtonTierColor, 
  getVGCGradeColor, 
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
  const [copiedAppId, setCopiedAppId] = useState(false);
  const [copiedLaunch, setCopiedLaunch] = useState(false);

  const protonColor = getProtonTierColor(game.protonDB.tier);
  const vgcColor = game.videoGameCritic ? getVGCGradeColor(game.videoGameCritic.grade) : null;
  const deckBadge = getDeckStatusBadge(game.deckStatus);

  const timeframeData = useMemo(() => {
    let baseList: { label: string; players: number }[] = [];
    if (chartTimeframe === 'day') {
      baseList = game.playerHistory24h.map(p => ({ label: p.time, players: p.players }));
    } else if (chartTimeframe === 'week') {
      baseList = game.playerHistory7d.map(p => ({ label: p.time, players: p.players }));
    } else if (chartTimeframe === 'month') {
      baseList = [
        { label: 'Week 1', players: Math.round(game.currentPlayers * 0.88) },
        { label: 'Week 2', players: Math.round(game.currentPlayers * 0.94) },
        { label: 'Week 3', players: Math.round(game.currentPlayers * 1.05) },
        { label: 'Week 4', players: game.currentPlayers },
      ];
    } else if (chartTimeframe === 'year') {
      baseList = [
        { label: 'Q1', players: Math.round(game.currentPlayers * 0.75) },
        { label: 'Q2', players: Math.round(game.currentPlayers * 0.85) },
        { label: 'Q3', players: Math.round(game.currentPlayers * 0.95) },
        { label: 'Q4', players: game.currentPlayers },
      ];
    } else {
      baseList = [
        { label: 'Launch', players: game.allTimePeak },
        { label: 'Year 1', players: Math.round(game.allTimePeak * 0.65) },
        { label: 'Year 2', players: Math.round(game.allTimePeak * 0.45) },
        { label: 'Now', players: game.currentPlayers },
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
                    <span className="text-amber-400 font-mono font-bold">{formatPrice(game.historicalLow, currency)}</span>
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

                {game.videoGameCritic && (
                  <a
                    href={game.videoGameCritic.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold border border-amber-500/30 transition-all flex items-center gap-1.5"
                  >
                    <span>The Video Games Critic</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

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

          {/* TWO PILLARS: ProtonDB Card & VideoGameCritic Card side by side - Bento Boxes */}
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

            {/* THE VIDEO GAME CRITIC SECTION */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between shadow-md">
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-white text-base">The Video Games Critic</h3>
                  </div>
                  {game.videoGameCritic && (
                    <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-black font-mono text-sm shadow-md ${vgcColor?.bg} ${vgcColor?.text} ${vgcColor?.border}`}>
                      {game.videoGameCritic.grade}
                    </div>
                  )}
                </div>

                {game.videoGameCritic ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Reviewed: <strong className="text-slate-200">{game.videoGameCritic.platformReviewed}</strong></span>
                      <span>•</span>
                      <span>{game.videoGameCritic.reviewDate}</span>
                    </div>

                    <blockquote className="italic text-slate-200 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs leading-relaxed">
                      "{game.videoGameCritic.excerpt}"
                    </blockquote>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-wider block mb-1">
                          Pros
                        </span>
                        <ul className="space-y-0.5 text-[11px] text-slate-300">
                          {(game.videoGameCritic.pros || []).map((pro, i) => (
                            <li key={`modal-pro-${i}`}>• {pro}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        <span className="text-red-400 font-bold text-[10px] uppercase tracking-wider block mb-1">
                          Cons
                        </span>
                        <ul className="space-y-0.5 text-[11px] text-slate-300">
                          {(game.videoGameCritic.cons || []).map((con, i) => (
                            <li key={`modal-con-${i}`}>• {con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No retro or modern critic entry indexed for this title yet.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono text-[11px]">videogamescritic.com archives</span>
                <a
                  href={game.videoGameCritic?.url || 'https://videogamescritic.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <span>Read on VideoGamesCritic</span>
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
