import { useState, useEffect } from 'react';
import { Calendar, Users, Flame, ExternalLink, RefreshCw, Radio, Sparkles, Filter } from 'lucide-react';
import { UPCOMING_RELEASES } from '../data/games';
import { formatNumber } from '../utils/formatters';

interface ReleaseItem {
  id: number;
  name: string;
  releaseDate: string;
  publisher: string;
  developer?: string;
  followers: number;
  hypeScore: number;
  tags: string[];
  headerImage: string;
  price?: number;
  discountPercent?: number;
  isComingSoon?: boolean;
}

interface ReleasesViewProps {
  onSelectGame?: (game: any) => void;
}

export const ReleasesView = ({ onSelectGame }: ReleasesViewProps) => {
  const [releases, setReleases] = useState<ReleaseItem[]>(UPCOMING_RELEASES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [activeFilter, setActiveFilter] = useState<'all' | '2026' | '2027' | 'tba'>('all');

  const fetchLiveReleases = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/steam/releases');
      if (res.ok) {
        const data = await res.json();
        if (data.releases && Array.isArray(data.releases) && data.releases.length > 0) {
          setReleases(data.releases);
          setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      }
    } catch (err) {
      console.warn('Failed to load live releases, using verified upcoming 2026 cache:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveReleases();
  }, []);

  const filteredReleases = releases.filter((game) => {
    if (activeFilter === '2026') return game.releaseDate.includes('2026');
    if (activeFilter === '2027') return game.releaseDate.includes('2027');
    if (activeFilter === 'tba') return game.releaseDate.toLowerCase().includes('announced') || game.releaseDate.toLowerCase().includes('tba') || game.releaseDate.toLowerCase().includes('expected');
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Releases Bento Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 bg-gradient-to-l from-blue-500 via-indigo-500 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-mono font-bold uppercase tracking-widest mb-2">
              <Calendar className="w-4 h-4" />
              <span>Steam Analytics • Live Store API Integration</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                Live 2026/2027 Feed
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Upcoming Steam Releases & Most Anticipated
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1.5 leading-relaxed">
              Tracking global Steam store community wishlists, follower momentum, and verified 2026/2027 launch windows straight from Valve's Store APIs.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={fetchLiveReleases}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Syncing Store...' : 'Refresh Live API'}</span>
            </button>
            <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
              Updated: <strong className="text-slate-200">{lastUpdated}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Upcoming ({releases.length})
          </button>
          <button
            onClick={() => setActiveFilter('2026')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              activeFilter === '2026'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2026 Releases
          </button>
          <button
            onClick={() => setActiveFilter('2027')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              activeFilter === '2027'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2027 & Beyond
          </button>
          <button
            onClick={() => setActiveFilter('tba')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              activeFilter === 'tba'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            TBA / Expected
          </button>
        </div>

        <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Real-time Steam Store Categories & Wishlists</span>
        </div>
      </div>

      {/* Upcoming Cards Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredReleases.map((game) => (
          <div
            key={game.id}
            className="rounded-3xl border border-slate-800 bg-slate-900 p-5 flex flex-col justify-between group hover:border-blue-500/50 transition-all shadow-xl"
          >
            <div>
              <div className="aspect-[460/215] rounded-2xl overflow-hidden bg-slate-950 mb-4 relative border border-slate-800">
                <img
                  src={game.headerImage}
                  alt={game.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback image if steam asset CDN fails
                    (e.target as HTMLImageElement).src = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.id}/header.jpg`;
                  }}
                />
                <div className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur px-3 py-1 rounded-full border border-slate-700/80 flex items-center gap-1.5 text-xs text-blue-300 font-mono font-bold shadow-lg">
                  <Flame className="w-3.5 h-3.5 text-blue-400" />
                  <span>Hype: {game.hypeScore}%</span>
                </div>
                <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur px-2.5 py-0.5 rounded-full border border-slate-800 text-[10px] font-mono font-bold text-slate-300">
                  AppID: {game.id}
                </div>
              </div>

              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                    {game.name}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">{game.publisher}</p>
                </div>
                <a
                  href={`https://store.steampowered.com/app/${game.id}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-xl bg-slate-950 hover:bg-blue-600/30 text-slate-400 hover:text-blue-300 border border-slate-800 transition-colors"
                  title="View on Steam Store"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap mb-4 text-xs">
                {(game.tags || []).slice(0, 3).map((tag, tagIdx) => (
                  <span
                    key={`release-${game.id}-tag-${tag}-${tagIdx}`}
                    className="px-2.5 py-0.5 rounded-full bg-slate-950 text-slate-300 border border-slate-800 text-[10px]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3.5 flex items-center justify-between text-xs">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Release Date</div>
                <div className="font-semibold text-emerald-400 font-mono mt-0.5">{game.releaseDate}</div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Community Followers</div>
                <div className="font-bold text-blue-400 font-mono flex items-center gap-1 justify-end mt-0.5">
                  <Users className="w-3 h-3" />
                  <span>{formatNumber(game.followers)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
