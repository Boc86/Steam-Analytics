import { ExternalLink, Terminal, ShieldAlert } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800 text-slate-400 text-xs py-12 px-4 mt-16">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Attribution & Data Sources Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 border-b border-slate-800">
          {/* Steam Analytics Info */}
          <div className="space-y-3 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
            <div className="flex items-center gap-2 text-white font-mono font-bold text-sm">
              <span className="text-white">STEAM <span className="text-blue-400">ANALYTICS</span></span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-bold">Live Edition</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Steam Analytics provides real-time concurrent player metrics with trend lines, price history tracking, historical lows, and database inspection for Valve's Steam ecosystem.
            </p>
          </div>

          {/* ProtonDB Acknowledgment & Link */}
          <div className="space-y-3 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>ProtonDB Acknowledgment</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Linux and Steam Deck compatibility ratings, launch parameters, and community reports are powered by{' '}
              <a
                href="https://www.protondb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 font-semibold underline underline-offset-4 hover:text-blue-300 inline-flex items-center gap-1"
              >
                ProtonDB (www.protondb.com)
                <ExternalLink className="w-3 h-3" />
              </a>
              . Special gratitude to the ProtonDB community for advancing Linux and SteamOS handheld gaming.
            </p>
          </div>

          {/* Games-Popularity Acknowledgment */}
          <div className="space-y-3 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>Games-Popularity</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Historical player counts, concurrent peaks, and tracking metrics are powered by{' '}
              <a
                href="https://games-popularity.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 font-semibold underline underline-offset-4 hover:text-blue-300 inline-flex items-center gap-1"
              >
                Games Popularity (games-popularity.com)
                <ExternalLink className="w-3 h-3" />
              </a>
              . Special gratitude to this independent, unofficial service providing comprehensive historical data.
            </p>
          </div>

        </div>

        {/* Legal Disclaimer & Tech Stack */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>
              This application is an independent community project and is not affiliated with, authorized, or endorsed by Valve Corporation. Steam and the Steam logo are trademarks of Valve Corporation.
            </span>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0 font-medium">
            <a href="https://www.protondb.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
              ProtonDB.com
            </a>
            <span>•</span>
            <a href="https://games-popularity.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
              Games-Popularity.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
