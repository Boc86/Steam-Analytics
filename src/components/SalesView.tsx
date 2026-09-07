import { useState, useMemo } from 'react';
import { 
  Tag, 
  Percent, 
  Sparkles, 
  ExternalLink, 
  Flame, 
  DollarSign, 
  Award,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { Currency, SteamGame } from '../types';
import { 
  formatPrice, 
  formatNumber, 
  getProtonTierColor, 
} from '../utils/formatters';

interface SalesViewProps {
  games: SteamGame[];
  currency: Currency;
  onSelectGame: (game: SteamGame) => void;
}

export const SalesView = ({
  games,
  currency,
  onSelectGame,
}: SalesViewProps) => {
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [onlyHistoricalLows, setOnlyHistoricalLows] = useState(false);
  const [maxPriceLimit, setMaxPriceLimit] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'discount' | 'price' | 'rating' | 'players'>('discount');

  // Filter discounted games
  const salesGames = useMemo(() => {
    return games
      .filter((g) => {
        if (g.discountPercent <= 0) return false;
        if (minDiscount > 0 && g.discountPercent < minDiscount) return false;
        if (onlyHistoricalLows && g.price > g.historicalLow) return false;
        if (maxPriceLimit !== null && g.price > maxPriceLimit) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'discount') return b.discountPercent - a.discountPercent;
        if (sortBy === 'price') return a.price - b.price;
        if (sortBy === 'rating') return b.steamRating - a.steamRating;
        if (sortBy === 'players') return b.currentPlayers - a.currentPlayers;
        return 0;
      });
  }, [games, minDiscount, onlyHistoricalLows, maxPriceLimit, sortBy]);

  // Key stats
  const highestDiscount = useMemo(() => {
    const sorted = [...games].sort((a, b) => b.discountPercent - a.discountPercent);
    return sorted[0];
  }, [games]);

  return (
    <div className="space-y-6">
      {/* Sales Header Bento Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 bg-gradient-to-l from-green-500 via-blue-500 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-widest mb-2">
              <Tag className="w-4 h-4" />
              <span>SteamDB Real-time Price Tracker</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Verified Sales & Historical Lows
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1.5 leading-relaxed">
              Live price drops cross-referenced against historical pricing databases, ProtonDB Linux ratings, and The Video Games Critic scores.
            </p>
          </div>

          {highestDiscount && highestDiscount.discountPercent > 0 && (
            <div 
              onClick={() => onSelectGame(highestDiscount)}
              className="bg-slate-950/90 border border-slate-800 hover:border-green-500/50 rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all flex-shrink-0 shadow-lg group"
            >
              <div className="w-14 h-14 rounded-2xl bg-green-500/15 text-green-400 flex flex-col items-center justify-center font-mono font-black text-base border border-green-500/30 group-hover:scale-105 transition-transform">
                <span>-{highestDiscount.discountPercent}%</span>
              </div>
              <div>
                <div className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Top Discount Spotlight</div>
                <div className="text-sm font-bold text-white truncate max-w-[160px] group-hover:text-green-300 transition-colors">{highestDiscount.name}</div>
                <div className="text-xs font-mono text-green-400 font-bold mt-0.5">
                  {formatPrice(highestDiscount.price, currency)} <span className="line-through text-slate-500 text-[10px] font-normal">{formatPrice(highestDiscount.originalPrice, currency)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar - Bento Styled */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        {/* Discount Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-1 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-400" /> Minimum Discount:
          </span>
          <button
            onClick={() => setMinDiscount(0)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
              minDiscount === 0 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Deals
          </button>
          <button
            onClick={() => setMinDiscount(25)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
              minDiscount === 25 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ≥ 25%
          </button>
          <button
            onClick={() => setMinDiscount(50)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
              minDiscount === 50 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ≥ 50%
          </button>
          <button
            onClick={() => setMinDiscount(75)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
              minDiscount === 75 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ≥ 75%
          </button>
        </div>

        {/* Historical Lows & Under $10 toggles */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => setOnlyHistoricalLows(!onlyHistoricalLows)}
            className={`px-3.5 py-1.5 rounded-full border font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
              onlyHistoricalLows
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Record Lows Only</span>
          </button>

          <button
            onClick={() => setMaxPriceLimit(maxPriceLimit === 10 ? null : 10)}
            className={`px-3.5 py-1.5 rounded-full border font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
              maxPriceLimit === 10
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-blue-400" />
            <span>Under $10</span>
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800">
            <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-bold text-xs"
            >
              <option value="discount" className="bg-slate-900">Highest % Off</option>
              <option value="price" className="bg-slate-900">Lowest Price</option>
              <option value="rating" className="bg-slate-900">Highest Rating</option>
              <option value="players" className="bg-slate-900">Most Active</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deals Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {salesGames.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 font-medium">
            No deals found matching your current filter criteria.
          </div>
        ) : (
          salesGames.map((game) => {
            const protonColor = getProtonTierColor(game.protonDB.tier);
            const isHistoricalLow = game.price <= game.historicalLow;

            return (
              <div
                key={game.id}
                onClick={() => onSelectGame(game)}
                className="rounded-3xl border border-slate-800 bg-slate-900 hover:border-blue-500/50 transition-all p-6 flex flex-col justify-between group cursor-pointer shadow-xl"
              >
                <div>
                  {/* Capsule Header & Discount Pill */}
                  <div className="relative rounded-2xl overflow-hidden mb-4 aspect-[460/215] bg-slate-950 border border-slate-800">
                    <img
                      src={game.headerImage}
                      alt={game.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-green-500 text-slate-950 font-black text-xs font-mono shadow-lg">
                        -{game.discountPercent}%
                      </span>
                      {isHistoricalLow && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] font-mono uppercase tracking-wider shadow-lg flex items-center gap-1">
                          <Award className="w-3 h-3" /> Record Low
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Dev */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                        {game.name}
                      </h3>
                      <p className="text-xs text-slate-400">{game.developer}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                      #{game.id}
                    </span>
                  </div>

                  {/* Badges: ProtonDB & Steam review sentiment */}
                  <div className="flex items-center gap-2 flex-wrap mb-4 text-xs">
                    <span className={`px-2.5 py-0.5 rounded-full border font-mono font-bold text-[11px] ${protonColor.bg} ${protonColor.text} ${protonColor.border}`}>
                      Proton: {game.protonDB.tier}
                    </span>

                    <span className="text-[11px] text-slate-400 font-mono">
                      ⭐ {game.steamRating}%
                    </span>
                  </div>
                </div>

                {/* Bottom Pricing Row */}
                <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Deal Price</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black font-mono text-green-400">
                        {formatPrice(game.price, currency)}
                      </span>
                      <span className="text-xs font-mono line-through text-slate-500">
                        {formatPrice(game.originalPrice, currency)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://store.steampowered.com/app/${game.id}`, '_blank', 'noopener,noreferrer');
                    }}
                    className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                  >
                    <span>Store</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
