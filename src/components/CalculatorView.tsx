import { useState, useEffect, FormEvent } from 'react';
import { 
  Calculator, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  DollarSign, 
  Ghost, 
  Gamepad2, 
  ExternalLink, 
  Copy, 
  Check, 
  ArrowUpDown, 
  Sparkles,
  TrendingDown,
  Layers,
  Award
} from 'lucide-react';
import { CalculatorProfile, CalculatorGame, Currency } from '../types';
import { formatNumber, formatPrice } from '../utils/formatters';

interface CalculatorViewProps {
  currency: Currency;
  onSelectGameById: (id: number) => void;
}

export const CalculatorView = ({ currency, onSelectGameById }: CalculatorViewProps) => {
  const [userInput, setUserInput] = useState('');
  const [activeUser, setActiveUser] = useState('gabelogannewell');
  const [profile, setProfile] = useState<CalculatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [gameFilter, setGameFilter] = useState('');
  const [sortBy, setSortBy] = useState<'playtime' | 'price' | 'valuePerHour' | 'name'>('playtime');
  const [sortAsc, setSortAsc] = useState(false);

  const presets = [
    { label: 'Gabe Newell (Valve)', id: 'gabelogannewell' },
    { label: 'Robin Walker (Valve)', id: 'robinwalker' },
    { label: 'Pro Gamer', id: '76561198000000001' },
    { label: 'Indie Enthusiast', id: 'indiegamer' }
  ];

  const fetchProfile = (userId: string) => {
    setLoading(true);
    setError(null);
    fetch(`/api/steam/calculator?user=${encodeURIComponent(userId)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.profile) {
          setProfile(data.profile);
        } else {
          setError(data.error || 'Failed to load profile');
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Connection error');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProfile(activeUser);
  }, [activeUser]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (userInput.trim()) {
      setActiveUser(userInput.trim());
    }
  };

  const handleCopySteamId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const filteredGames = (profile?.allGames || [])
    .filter(g => g.name.toLowerCase().includes(gameFilter.toLowerCase()))
    .sort((a, b) => {
      let diff = 0;
      if (sortBy === 'playtime') diff = b.playtimeHours - a.playtimeHours;
      else if (sortBy === 'price') diff = b.priceUSD - a.priceUSD;
      else if (sortBy === 'valuePerHour') diff = a.pricePerHourUSD - b.pricePerHourUSD;
      else if (sortBy === 'name') diff = a.name.localeCompare(b.name);
      return sortAsc ? -diff : diff;
    });

  return (
    <div className="space-y-6">
      {/* Top Banner and Search Bar */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-500/30">
              <Calculator className="w-3.5 h-3.5" />
              <span>SteamDB Account Valuation Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Steam Calculator
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Calculate your total account value, playtime investments, cost-per-hour efficiency, and unplayed backlog (pile of shame).
            </p>
          </div>

          {/* Quick preset selector buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Quick Profiles:</span>
            {presets.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setUserInput(p.id);
                  setActiveUser(p.id);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                  activeUser === p.id 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md' 
                    : 'bg-slate-900/80 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Enter SteamID64, custom vanity URL, or full profile link..."
              className="w-full pl-12 pr-4 py-3 bg-slate-950/80 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono shadow-inner transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <span>Valuating Account...</span>
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4" />
                <span>Calculate Account</span>
              </>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !profile ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 rounded-full border-3 border-blue-500/20 border-t-blue-500 animate-spin" />
          <p className="text-sm font-mono text-slate-400 animate-pulse">
            Fetching Steam Community telemetry and computing valuations...
          </p>
        </div>
      ) : profile ? (
        <div className="space-y-6">
          {/* User Profile Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <img
                  src={profile.avatarUrl}
                  alt={profile.personaname}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-700 shadow-md bg-slate-800"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://avatars.fastly.steamstatic.com/c5d56249ee5d28a07db4ac9f7f60af961fab5426_full.jpg';
                  }}
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900" title="Profile Active" />
              </div>

              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-black text-white">{profile.personaname}</h2>
                  {profile.realname && (
                    <span className="text-sm text-slate-400">({profile.realname})</span>
                  )}
                  {profile.vacBanned ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> VAC Banned
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Good Standing
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span>ID64: {profile.steamId64}</span>
                    <button
                      onClick={() => handleCopySteamId(profile.steamId64)}
                      className="text-slate-400 hover:text-white transition-colors"
                      title="Copy SteamID64"
                    >
                      {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  {profile.memberSince && (
                    <span>• Member since {profile.memberSince}</span>
                  )}
                  {profile.location && (
                    <span>• {profile.location}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={`https://steamcommunity.com/profiles/${profile.steamId64}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-2 transition-colors"
              >
                <span>View on Steam</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Key Metrics Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Account Value */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Account Value (Store)</span>
                <DollarSign className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-black text-white font-mono">
                {formatPrice(profile.totalAccountValueUSD, currency)}
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>Lowest historical: </span>
                <span className="font-bold text-emerald-400">
                  {formatPrice(profile.totalLowestValueUSD, currency)}
                </span>
              </div>
            </div>

            {/* Card 2: Total Playtime */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Total Playtime</span>
                <Clock className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-3xl font-black text-white font-mono">
                {formatNumber(Math.round(profile.totalHoursPlayed))} <span className="text-base text-slate-400 font-sans font-normal">hours</span>
              </div>
              <div className="mt-2 text-xs text-slate-400 font-mono">
                ≈ {(profile.totalHoursPlayed / 24).toFixed(1)} consecutive days played
              </div>
            </div>

            {/* Card 3: Price Per Hour */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Price / Hour</span>
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-400 font-mono">
                ${profile.averagePricePerHourUSD} <span className="text-base text-slate-400 font-sans font-normal">/ hr</span>
              </div>
              <div className="mt-2 text-xs text-slate-400 font-mono">
                Cost efficiency over {profile.totalGames} games
              </div>
            </div>

            {/* Card 4: Backlog / Pile of Shame */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Pile of Shame (Backlog)</span>
                <Ghost className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-amber-400 font-mono">
                {profile.unplayedPercent}%
              </div>
              <div className="mt-2 text-xs text-slate-400 font-mono">
                {profile.unplayedGamesCount} of {profile.totalGames} games never opened
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${profile.unplayedPercent}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Owned Games Breakdown Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-blue-400" />
                  Library Games Breakdown
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detailed valuations, hours recorded, and historical lowest prices
                </p>
              </div>

              {/* Table search filter */}
              <div className="flex items-center gap-3">
                <div className="relative min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={gameFilter}
                    onChange={(e) => setGameFilter(e.target.value)}
                    placeholder="Search library..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-xs">
                    <th 
                      className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                      onClick={() => {
                        if (sortBy === 'name') setSortAsc(!sortAsc);
                        else { setSortBy('name'); setSortAsc(false); }
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Game</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors"
                      onClick={() => {
                        if (sortBy === 'playtime') setSortAsc(!sortAsc);
                        else { setSortBy('playtime'); setSortAsc(false); }
                      }}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Playtime</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors"
                      onClick={() => {
                        if (sortBy === 'price') setSortAsc(!sortAsc);
                        else { setSortBy('price'); setSortAsc(false); }
                      }}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Current Price</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-right">Lowest Price</th>
                    <th 
                      className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors"
                      onClick={() => {
                        if (sortBy === 'valuePerHour') setSortAsc(!sortAsc);
                        else { setSortBy('valuePerHour'); setSortAsc(false); }
                      }}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Price / Hour</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredGames.map((game) => (
                    <tr 
                      key={game.appid}
                      onClick={() => onSelectGameById(game.appid)}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={game.headerImage}
                            alt={game.name}
                            className="w-16 h-8 object-cover rounded shadow-sm flex-shrink-0 bg-slate-800"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.appid}/capsule_231x87.jpg`;
                            }}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors truncate flex items-center gap-1.5">
                              <span>{game.name}</span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">AppID: {game.appid}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono">
                        {game.playtimeHours > 0 ? (
                          <div className="font-bold text-slate-200">
                            {formatNumber(game.playtimeHours)}h
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-500 text-xs font-semibold">
                            Never played
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-300 font-bold">
                        {game.priceUSD === 0 ? 'Free' : `$${game.priceUSD.toFixed(2)}`}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">
                        {game.lowestPriceUSD === 0 ? 'Free' : `$${game.lowestPriceUSD.toFixed(2)}`}
                      </td>

                      <td className="py-3 px-4 text-right font-mono">
                        {game.playtimeHours > 0 ? (
                          <span className="text-blue-400 font-bold">
                            ${game.pricePerHourUSD.toFixed(2)}/h
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredGames.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  No games found matching your search.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
