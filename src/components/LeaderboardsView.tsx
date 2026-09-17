import { useState, useEffect, useMemo } from 'react';
import { Trophy, Heart, TrendingUp, Users, ExternalLink, Flame, Search, Crown, Medal } from 'lucide-react';
import { formatNumber } from '../utils/formatters';
import { LeaderboardItem } from '../types';

interface LeaderboardsViewProps {
  onSelectGameById: (id: number) => void;
}

export const LeaderboardsView = ({ onSelectGameById }: LeaderboardsViewProps) => {
  const [activeBoard, setActiveBoard] = useState<'wishlist' | 'sellers' | 'players'>('players');
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    setItems([]);
    
    let endpoint = '/api/steam/mostplayed';
    if (activeBoard === 'wishlist') {
      endpoint = '/api/steam/topwishlist';
    } else if (activeBoard === 'sellers') {
      endpoint = '/api/steam/topsellers';
    }
    
    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.items)) {
          setItems(data.items);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch leaderboard:', err);
        setLoading(false);
      });
  }, [activeBoard]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      item => 
        item.name.toLowerCase().includes(q) || 
        String(item.steamId || item.id).includes(q)
    );
  }, [items, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header with Navigation Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Global Steam Leaderboards
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time official Steam worldwide rankings across concurrent players, sales velocity, and community wishlists.
          </p>
        </div>
        
        {/* Switcher with Wishlist, Top Sellers, and Most Players */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner overflow-x-auto scrollbar-none">
          <button 
            id="leaderboard-tab-players"
            onClick={() => setActiveBoard('players')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeBoard === 'players' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-cyan-400" />
            <span>Most Players</span>
          </button>

          <button 
            id="leaderboard-tab-wishlist"
            onClick={() => setActiveBoard('wishlist')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeBoard === 'wishlist' 
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-pink-400" />
            <span>Top Wishlisted</span>
          </button>

          <button 
            id="leaderboard-tab-sellers"
            onClick={() => setActiveBoard('sellers')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeBoard === 'sellers' 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Top Sellers</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
        {/* Table Top Toolbar */}
        <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {activeBoard === 'players' && (
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
            )}
            {activeBoard === 'wishlist' && (
              <Heart className="w-4 h-4 text-pink-400 flex-shrink-0" />
            )}
            {activeBoard === 'sellers' && (
              <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider truncate">
                {activeBoard === 'players' && 'Most Played Games by Concurrent Players'}
                {activeBoard === 'wishlist' && 'Global Top Wishlisted Upcoming Games'}
                {activeBoard === 'sellers' && 'Global Top Sellers by Store Revenue'}
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {activeBoard === 'players' && 'Ranked by live concurrent online players'}
                {activeBoard === 'wishlist' && 'Ranked by Steam store popular wishlist momentum'}
                {activeBoard === 'sellers' && 'Ranked by global Steam store gross sales'}
              </span>
            </div>
          </div>

          {/* Search bar inside leaderboard */}
          <div className="relative w-full sm:w-64 flex-shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search ranked games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="w-9 h-9 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />
            <p className="text-sm text-slate-400 font-mono animate-pulse">
              Querying Steam API live global telemetry...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px] select-none">
                  <th className="py-3.5 px-4 w-20 text-center">Rank</th>
                  <th className="py-3.5 px-4">Game</th>
                  <th className="py-3.5 px-6 text-right">
                    {activeBoard === 'players' && 'Active Players / 24h Peak'}
                    {activeBoard === 'wishlist' && 'Community Wishlists'}
                    {activeBoard === 'sellers' && 'Store Status / Price'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredItems.map((item, index) => {
                  const appId = item.steamId || item.id;
                  const rank = item.position || index + 1;

                  return (
                    <tr 
                      key={appId || index} 
                      className="hover:bg-slate-800/50 transition-colors group cursor-pointer" 
                      onClick={() => onSelectGameById(appId)}
                    >
                      {/* Rank Column with Podium styling */}
                      <td className="py-3.5 px-4 text-center">
                        {rank === 1 ? (
                          <div className="inline-flex items-center justify-center gap-1 w-9 h-7 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-mono font-black text-xs shadow-sm">
                            <Crown className="w-3.5 h-3.5 text-yellow-400" />
                            <span>1</span>
                          </div>
                        ) : rank === 2 ? (
                          <div className="inline-flex items-center justify-center gap-1 w-9 h-7 rounded-lg bg-slate-300/20 text-slate-200 border border-slate-400/40 font-mono font-black text-xs shadow-sm">
                            <Medal className="w-3.5 h-3.5 text-slate-300" />
                            <span>2</span>
                          </div>
                        ) : rank === 3 ? (
                          <div className="inline-flex items-center justify-center gap-1 w-9 h-7 rounded-lg bg-amber-700/20 text-amber-300 border border-amber-600/40 font-mono font-black text-xs shadow-sm">
                            <Medal className="w-3.5 h-3.5 text-amber-400" />
                            <span>3</span>
                          </div>
                        ) : (
                          <span className="font-mono text-xs font-semibold text-slate-400">
                            #{rank}
                          </span>
                        )}
                      </td>

                      {/* Game Capsule & Metadata */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-18 h-9 rounded-md overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800 shadow-sm relative group-hover:border-slate-600 transition-colors">
                            <img 
                              src={`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/capsule_231x87.jpg`}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;
                              }}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors flex items-center gap-2 truncate">
                              <span className="truncate">{item.name}</span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 flex-shrink-0" />
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-slate-400 font-mono">AppID: {appId}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Value / Telemetry Column */}
                      <td className="py-3.5 px-6 text-right">
                        {activeBoard === 'players' && (
                          <div className="flex flex-col items-end">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 text-cyan-300 rounded-md font-mono text-xs font-bold border border-cyan-500/25">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                              <span>{formatNumber(item.currentPlayers || item.peak24h || 0)}</span>
                              <span className="text-[10px] text-cyan-400/70 font-normal">playing</span>
                            </div>
                            {item.peak24h && (
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                24h Peak: {formatNumber(item.peak24h)}
                              </span>
                            )}
                          </div>
                        )}

                        {activeBoard === 'wishlist' && (
                          <div className="flex flex-col items-end">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-pink-500/10 text-pink-300 rounded-md font-mono text-xs font-bold border border-pink-500/25">
                              <Heart className="w-3 h-3 text-pink-400 fill-pink-500/20" />
                              <span>{item.followers ? formatNumber(item.followers) : 'Unavailable'}</span>
                              <span className="text-[10px] text-pink-400/70 font-normal">wishlists</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                              #{rank} Most Wanted
                            </span>
                          </div>
                        )}

                        {activeBoard === 'sellers' && (
                          <div className="flex flex-col items-end">
                            {item.discountPercent && item.discountPercent > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-black border border-emerald-500/30">
                                  -{item.discountPercent}%
                                </span>
                                <span className="text-emerald-400 font-mono text-xs font-bold">
                                  {item.price !== undefined ? `$${item.price.toFixed(2)}` : 'On Sale'}
                                </span>
                              </div>
                            ) : item.price !== undefined ? (
                              <span className="text-slate-200 font-mono text-xs font-bold">
                                {item.price === 0 ? (
                                  <span className="text-blue-400">Free to Play</span>
                                ) : (
                                  `$${item.price.toFixed(2)}`
                                )}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/20">
                                Top Grossing
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                              #{rank} Revenue Rank
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Empty State */}
            {filteredItems.length === 0 && !loading && (
              <div className="p-12 text-center space-y-3">
                <p className="text-sm text-slate-400">
                  {searchQuery ? `No games found matching "${searchQuery}".` : 'No leaderboard data available.'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-blue-400 transition-colors cursor-pointer"
                  >
                    Clear search query
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
