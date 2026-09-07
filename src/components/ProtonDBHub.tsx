import { useState, useMemo, MouseEvent } from 'react';
import { 
  Terminal, 
  ExternalLink, 
  Copy, 
  Check, 
  Layers, 
  Cpu, 
  Gamepad, 
  Sliders, 
  ShieldCheck, 
  Zap,
  Sparkles,
  Info
} from 'lucide-react';
import { SteamGame, ProtonTier } from '../types';
import { getProtonTierColor, getDeckStatusBadge, formatNumber } from '../utils/formatters';

interface ProtonDBHubProps {
  games: SteamGame[];
  onSelectGame: (game: SteamGame) => void;
}

export const ProtonDBHub = ({ games, onSelectGame }: ProtonDBHubProps) => {
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopyLaunchOption = (id: number, text: string, e: MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredGames = useMemo(() => {
    if (selectedTier === 'all') return games;
    return games.filter((g) => g.protonDB.tier === selectedTier);
  }, [games, selectedTier]);

  // Statistics
  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Native: 0,
      Platinum: 0,
      Gold: 0,
      Silver: 0,
      Bronze: 0,
      Borked: 0,
    };
    games.forEach((g) => {
      counts[g.protonDB.tier] = (counts[g.protonDB.tier] || 0) + 1;
    });
    return counts;
  }, [games]);

  return (
    <div className="space-y-6">
      {/* ProtonDB Feature Hero Bento Banner */}
      <div className="relative rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 bg-gradient-to-l from-blue-500 via-cyan-500 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-mono font-bold uppercase tracking-widest mb-2">
              <Terminal className="w-4 h-4" />
              <span>ProtonDB Linux & SteamOS Intelligence Hub</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Linux Gaming & Steam Deck Compatibility
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              Crowdsourced community compatibility reports powered by{' '}
              <a 
                href="https://www.protondb.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 font-semibold underline underline-offset-4 hover:text-blue-300 inline-flex items-center gap-0.5"
              >
                ProtonDB.com <ExternalLink className="w-3 h-3" />
              </a>
              . Discover verified launch commands, custom GE-Proton runners, and graphics tweaks for flawless performance on Steam Deck LCD, OLED, and Linux desktops.
            </p>

            <div className="mt-5 flex items-center gap-3 flex-wrap text-xs">
              <a
                href="https://www.protondb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-500/20"
              >
                <span>Visit Official ProtonDB</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <span className="text-slate-400 border-l border-slate-800 pl-3">
                Over <strong className="text-white font-mono">150,000+</strong> crowdsourced Linux reports tracked globally
              </span>
            </div>
          </div>

          {/* Quick Tier Summary Box - Bento Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col gap-2.5 min-w-[260px] shadow-lg">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>ProtonDB Tier Breakdown</span>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-emerald-400">
                <span className="font-bold">Native Linux:</span>
                <span>{tierCounts.Native || 0} games</span>
              </div>
              <div className="flex justify-between items-center text-blue-400">
                <span className="font-bold">Platinum (Flawless):</span>
                <span>{tierCounts.Platinum || 0} games</span>
              </div>
              <div className="flex justify-between items-center text-amber-300">
                <span className="font-bold">Gold (Minor Tweaks):</span>
                <span>{tierCounts.Gold || 0} games</span>
              </div>
              <div className="flex justify-between items-center text-red-400">
                <span className="font-bold">Borked (Anti-Cheat):</span>
                <span>{tierCounts.Borked || 0} games</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-2 overflow-x-auto scrollbar-none shadow-lg">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 flex-shrink-0">Filter Tier:</span>
        
        <button
          onClick={() => setSelectedTier('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            selectedTier === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          All Games ({games.length})
        </button>

        <button
          onClick={() => setSelectedTier('Native')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            selectedTier === 'Native'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'bg-slate-950 text-emerald-400 hover:bg-emerald-500/10 border border-slate-800'
          }`}
        >
          Native ({tierCounts.Native || 0})
        </button>

        <button
          onClick={() => setSelectedTier('Platinum')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            selectedTier === 'Platinum'
              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
              : 'bg-slate-950 text-blue-400 hover:bg-blue-500/10 border border-slate-800'
          }`}
        >
          Platinum ({tierCounts.Platinum || 0})
        </button>

        <button
          onClick={() => setSelectedTier('Gold')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            selectedTier === 'Gold'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'bg-slate-950 text-amber-300 hover:bg-amber-500/10 border border-slate-800'
          }`}
        >
          Gold ({tierCounts.Gold || 0})
        </button>

        <button
          onClick={() => setSelectedTier('Borked')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            selectedTier === 'Borked'
              ? 'bg-red-500 text-white shadow-md'
              : 'bg-slate-950 text-red-400 hover:bg-red-500/10 border border-slate-800'
          }`}
        >
          Borked ({tierCounts.Borked || 0})
        </button>
      </div>

      {/* Game Cards Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredGames.map((game) => {
          const protonColor = getProtonTierColor(game.protonDB.tier);
          const deckBadge = getDeckStatusBadge(game.deckStatus);

          return (
            <div
              key={game.id}
              onClick={() => onSelectGame(game)}
              className="rounded-3xl border border-slate-800 bg-slate-900 hover:border-blue-500/50 transition-all p-6 flex flex-col justify-between group cursor-pointer shadow-xl"
            >
              <div>
                {/* Top Title Bar */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={game.headerImage}
                      alt={game.name}
                      referrerPolicy="no-referrer"
                      className="w-20 h-10 object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-slate-100 group-hover:text-blue-400 transition-colors truncate">
                        {game.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-mono text-slate-500">AppID: {game.id}</span>
                        <span>•</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${deckBadge.bg} ${deckBadge.text} ${deckBadge.border}`}>
                          {deckBadge.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ProtonDB Tier Badge */}
                  <div className={`px-3 py-1 rounded-full border font-mono font-black text-xs uppercase tracking-wider text-center flex-shrink-0 shadow-sm ${protonColor.bg} ${protonColor.text} ${protonColor.border}`}>
                    {game.protonDB.tier}
                  </div>
                </div>

                {/* Compatibility Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 mb-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Confidence</span>
                    <span className="text-slate-200 font-medium">{game.protonDB.confidence}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Reports</span>
                    <span className="text-blue-400 font-mono font-bold">{formatNumber(game.protonDB.totalReports)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Deck Target</span>
                    <span className="text-emerald-400 font-mono font-bold">{game.protonDB.deckFpsAverage || '60 FPS'}</span>
                  </div>
                </div>

                {/* Recommended Proton Runner */}
                <div className="mb-3 text-xs flex items-center gap-2 flex-wrap">
                  <span className="text-slate-400 font-medium">Recommended Runner: </span>
                  <span className="text-blue-400 font-mono font-bold bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                    {game.protonDB.recommendedProton}
                  </span>
                </div>

                {/* Community Tinker Steps & Launch Option */}
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2 mb-4">
                  <p className="line-clamp-2 leading-relaxed text-slate-300">
                    <strong className="text-slate-400 font-mono">Tweak Notes:</strong> {game.protonDB.tinkerSteps}
                  </p>

                  {game.protonDB.launchOptions && (
                    <div className="flex items-center justify-between gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700/80">
                      <div className="font-mono text-[11px] text-emerald-300 truncate">
                        {game.protonDB.launchOptions}
                      </div>
                      <button
                        onClick={(e) => handleCopyLaunchOption(game.id, game.protonDB.launchOptions!, e)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors flex-shrink-0"
                        title="Copy launch parameters"
                      >
                        {copiedId === game.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
                <span className="text-slate-500 font-mono text-[11px]">
                  Data verified from ProtonDB
                </span>

                <a
                  href={game.protonDB.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/30 transition-all font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  <span>ProtonDB Report</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
