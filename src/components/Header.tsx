import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Flame, 
  Tag, 
  Terminal, 
  Calendar, 
  ExternalLink, 
  Activity, 
  Radio,
  Loader2,
  DollarSign
} from 'lucide-react';
import { ActiveTab, Currency, SteamGame } from '../types';
import { formatNumber, formatPrice } from '../utils/formatters';

export interface SteamLiveSearchResult {
  id: number;
  name: string;
  tinyImage: string;
  headerImage: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  currentPlayers: number;
}

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  games: SteamGame[];
  onSelectGame: (game: SteamGame) => void;
  onSelectGameById?: (appId: number) => void;
}

export const Header = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  games,
  onSelectGame,
  onSelectGameById,
}: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [liveResults, setLiveResults] = useState<SteamLiveSearchResult[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [loadingGameId, setLoadingGameId] = useState<number | null>(null);
  const [globalStats, setGlobalStats] = useState<{ online: number; inGame: number; isLive: boolean }>({
    online: 0,
    inGame: 0,
    isLive: false,
  });
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Fetch real-time Steam global network stats (Online users & Playing Now)
  useEffect(() => {
    let isMounted = true;
    const fetchGlobalStats = async () => {
      try {
        const res = await fetch('/api/steam/global-stats');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.online && data.inGame && isMounted) {
            setGlobalStats({
              online: data.online,
              inGame: data.inGame,
              isLive: true,
            });
          }
        }
      } catch (err) {
        console.warn('Failed to load live Steam global stats:', err);
      }
    };

    fetchGlobalStats();
    const interval = setInterval(fetchGlobalStats, 30000); // 30s live refresh
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Quick filtered local games
  const localFiltered = searchQuery.trim() === '' 
    ? [] 
    : games.filter(g => 
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        g.id.toString().includes(searchQuery.trim()) ||
        g.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 4);

  // Live Steam store catalog search (access to ALL Steam games via live API)
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setLiveResults([]);
      setIsSearchingLive(false);
      return;
    }

    setIsSearchingLive(true);
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/steam/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.items)) {
            setLiveResults(data.items);
          }
        }
      } catch (err) {
        console.warn('Steam live search error:', err);
      } finally {
        setIsSearchingLive(false);
      }
    }, 280);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global results from live Steam API that aren't already in localFiltered
  const globalSteamResults = liveResults.filter(
    item => !localFiltered.some(lg => lg.id === item.id)
  ).slice(0, 8);

  const hasAnyResults = localFiltered.length > 0 || globalSteamResults.length > 0;

  const handleSelectGameItem = async (gameId: number) => {
    const existing = games.find(g => g.id === gameId);
    if (existing) {
      onSelectGame(existing);
      setIsSearchOpen(false);
      setSearchQuery('');
      return;
    }

    if (onSelectGameById) {
      setLoadingGameId(gameId);
      await onSelectGameById(gameId);
      setLoadingGameId(null);
    }
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const totalCurrentPlayers = games.reduce((acc, g) => acc + g.currentPlayers, 0);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      {/* Top Live Steam Status Bar */}
      <div className="w-full bg-slate-900/60 border-b border-slate-800/80 px-4 py-2 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-2" title="Total users online across Steam network (Live Valve telemetry)">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-slate-300 font-medium text-[11px] uppercase tracking-wider">Steam Online:</span>
              <span className="text-blue-400 font-bold font-mono">
                {formatNumber(globalStats.online)}
              </span>
            </div>

            <div className="flex items-center gap-2" title="Total players currently in a game on Steam (Live Valve telemetry)">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-300 font-medium text-[11px] uppercase tracking-wider">In-Game:</span>
              <span className="text-blue-400 font-bold font-mono">
                {formatNumber(globalStats.inGame)}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-slate-400">
              <span className="text-[11px] uppercase tracking-wider">Tracked:</span>
              <span className="text-white font-mono font-bold">{formatNumber(totalCurrentPlayers)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* ProtonDB quick indicator */}
            <a 
              href="https://www.protondb.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-blue-400 hover:border-blue-500/40 transition-colors"
              title="Verified Linux & Steam Deck compatibility by ProtonDB"
            >
              <Terminal className="w-3 h-3 text-blue-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">ProtonDB</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </a>

            {/* Currency Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 rounded-full px-2.5 py-0.5">
              <DollarSign className="w-3 h-3 text-slate-400" />
              <select
                id="currency-selector"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="bg-transparent text-[11px] font-bold text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="USD" className="bg-slate-900">USD ($)</option>
                <option value="EUR" className="bg-slate-900">EUR (€)</option>
                <option value="GBP" className="bg-slate-900">GBP (£)</option>
                <option value="JPY" className="bg-slate-900">JPY (¥)</option>
                <option value="CAD" className="bg-slate-900">CAD (C$)</option>
                <option value="AUD" className="bg-slate-900">AUD (A$)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Bar: Logo, Bento Pill Search, Live Feed Status */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => setActiveTab('charts')}
          className="w-full sm:w-auto flex items-center gap-3 cursor-pointer group flex-shrink-0"
        >
          <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387l3.69-5.187a4.015 4.015 0 0 1-.397-1.7c0-.28.03-.553.085-.817L8.03 13.56a2.64 2.64 0 0 1-1.28.334c-1.464 0-2.65-1.186-2.65-2.65 0-1.463 1.186-2.65 2.65-2.65 1.464 0 2.65 1.187 2.65 2.65 0 .098-.01.194-.02.29l3.52 2.49c.67-.428 1.465-.678 2.32-.678 2.347 0 4.25 1.903 4.25 4.25 0 2.348-1.903 4.25-4.25 4.25a4.238 4.238 0 0 1-2.91-1.16l-3.95 5.55C9.43 23.88 10.69 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl tracking-tighter text-white">STEAM <span className="text-blue-500">ANALYTICS</span></span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Live Platform</span>
            </div>
          </div>
        </div>

        {/* Bento-styled Pill Search Bar (Live Steam Global Store Catalog) */}
        <div ref={searchContainerRef} className="relative flex-1 min-w-0 w-auto max-w-lg">
          <div className="relative bg-slate-800/90 hover:bg-slate-800 transition-colors px-4 py-2 rounded-full flex items-center gap-2 border border-slate-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            {isSearchingLive ? (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
            ) : (
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            )}
            <input
              id="global-game-search"
              type="text"
              placeholder="Search all 100,000+ Steam games, IDs, publishers... (Press / to focus)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full min-w-0 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                className="text-xs text-slate-400 hover:text-white px-1"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Results Dropdown with Live Steam Store Access */}
          {isSearchOpen && searchQuery.trim().length >= 1 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 p-2 max-h-[480px] overflow-y-auto scrollbar-thin">
              {/* Section 1: In-App Tracked Games */}
              {localFiltered.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase font-bold text-slate-400 flex items-center justify-between">
                    <span>Active Platform Telemetry ({localFiltered.length})</span>
                    <span className="text-blue-400">Tracked</span>
                  </div>
                  <div className="divide-y divide-slate-800/60">
                    {localFiltered.map((game) => (
                      <div
                        key={game.id}
                        onClick={() => handleSelectGameItem(game.id)}
                        className="p-2 flex items-center justify-between hover:bg-slate-800/80 rounded-xl cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={game.headerImage} 
                            alt={game.name}
                            referrerPolicy="no-referrer"
                            className="w-14 h-7 object-cover rounded-lg bg-slate-950"
                          />
                          <div>
                            <div className="font-bold text-xs sm:text-sm text-slate-200">{game.name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span className="font-mono text-slate-500">AppID: {game.id}</span>
                              <span>•</span>
                              <span className="text-blue-400 font-semibold">{game.steamRating}% rating</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-right">
                          <span className="text-xs font-mono font-bold text-blue-400">
                            {formatNumber(game.currentPlayers)} playing
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: Global Steam Store Catalog (Live API matches like Gray Zone Warfare) */}
              {globalSteamResults.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase font-bold text-emerald-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Steam Store Catalog (Global Live)
                    </span>
                    <span className="text-[10px] text-slate-500">Steam API</span>
                  </div>
                  <div className="divide-y divide-slate-800/60">
                    {globalSteamResults.map((item, idx) => (
                      <div
                        key={`steam-global-res-${item.id}-${idx}`}
                        onClick={() => handleSelectGameItem(item.id)}
                        className="p-2 flex items-center justify-between hover:bg-slate-800/80 rounded-xl cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={item.tinyImage || item.headerImage} 
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-14 h-7 object-cover rounded-lg bg-slate-950"
                          />
                          <div>
                            <div className="font-bold text-xs sm:text-sm text-slate-200 group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {loadingGameId === item.id && (
                                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span className="font-mono text-slate-500">AppID: {item.id}</span>
                              <span>•</span>
                              <span className="text-emerald-400 font-mono">
                                {formatPrice(item.price, currency)}
                              </span>
                              {item.discountPercent > 0 && (
                                <span className="px-1 py-0.2 rounded bg-green-500/20 text-green-400 text-[10px] font-bold">
                                  -{item.discountPercent}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-right">
                          {item.currentPlayers > 0 ? (
                            <span className="text-xs font-mono font-bold text-emerald-400">
                              {formatNumber(item.currentPlayers)} in-game
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono uppercase px-2 py-1 rounded bg-slate-800 text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              Inspect Live
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading indicator inside dropdown */}
              {isSearchingLive && (
                <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2 font-mono">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  <span>Querying Steam Store API for all games matching "{searchQuery}"...</span>
                </div>
              )}

              {/* No results fallback */}
              {!isSearchingLive && !hasAnyResults && (
                <div className="p-6 text-center text-xs text-slate-400">
                  <div className="text-slate-300 font-bold mb-1">No Steam games found</div>
                  <div className="text-slate-500 text-[11px]">
                    No titles found matching "{searchQuery}". You can also enter a direct Steam AppID (e.g. 2479810).
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Steam Status Indicator */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-2.5 sm:px-3.5 py-1.5 rounded-full shadow-sm flex-shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider hidden sm:inline">
            Live Steam API
          </span>
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Navigation Tabs Bar with Bento Active Border indicator */}
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-none flex items-center gap-6 border-t border-slate-800">
        <button
          id="tab-charts"
          onClick={() => setActiveTab('charts')}
          className={`flex items-center gap-2 py-3.5 text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap border-b-2 ${
            activeTab === 'charts'
              ? 'text-white border-blue-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-blue-400" />
          <span>Dashboard & Charts</span>
        </button>

        <button
          id="tab-sales"
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 py-3.5 text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap border-b-2 ${
            activeTab === 'sales'
              ? 'text-white border-blue-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Tag className="w-3.5 h-3.5 text-green-400" />
          <span>Sales & Deals</span>
        </button>

        <button
          id="tab-proton"
          onClick={() => setActiveTab('proton')}
          className={`flex items-center gap-2 py-3.5 text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap border-b-2 ${
            activeTab === 'proton'
              ? 'text-white border-blue-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-purple-400" />
          <span>ProtonDB</span>
          <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">DECK</span>
        </button>

        <button
          id="tab-releases"
          onClick={() => setActiveTab('releases')}
          className={`flex items-center gap-2 py-3.5 text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap border-b-2 ${
            activeTab === 'releases'
              ? 'text-white border-blue-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>Releases</span>
        </button>
      </div>
    </header>
  );
};
