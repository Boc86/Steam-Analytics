import { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  ExternalLink, 
  Clock, 
  Tag, 
  User, 
  Sparkles, 
  ChevronRight,
  Filter,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { SteamPatchNote } from '../types';

interface PatchesViewProps {
  onSelectGameById: (id: number) => void;
}

export const PatchesView = ({ onSelectGameById }: PatchesViewProps) => {
  const [patches, setPatches] = useState<SteamPatchNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/steam/patches')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.patches) {
          setPatches(data.patches);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const uniqueGames: { id: number; name: string }[] = Array.from(
    new Set(patches.map(p => JSON.stringify({ id: p.appid, name: p.gameName })))
  ).map(s => JSON.parse(s as string));

  const filteredPatches = patches.filter(p => {
    const matchesApp = selectedApp === 'all' || p.appid.toString() === selectedApp;
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contents.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.gameName && p.gameName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesApp && matchesSearch;
  });

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp * 1000);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider border border-indigo-500/30 mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Steam Developer Changelogs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Patches & Updates
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mt-1">
            Real-time feed of official game patches, balance adjustments, hotfixes, and developer release notes directly from Valve's News API.
          </p>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider">Live Pipeline</div>
            <div className="text-[11px] text-slate-400 font-mono">30 recent patches indexed</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        {/* Search by keyword */}
        <div className="relative min-w-[240px] flex-1 sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patch notes, fixes, gameplay updates..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter by game */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedApp}
            onChange={(e) => setSelectedApp(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Indexed Games</option>
            {uniqueGames.map((g) => (
              <option key={g.id} value={g.id.toString()}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patches Feed */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 rounded-full border-3 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <p className="text-sm font-mono text-slate-400 animate-pulse">
            Querying Steam Developer announcements and patch logs...
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPatches.map((patch) => (
            <div
              key={patch.gid}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-xl transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Game cover thumbnail */}
                  <img
                    src={`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${patch.appid}/capsule_231x87.jpg`}
                    alt={patch.gameName || 'Game'}
                    className="w-24 h-12 object-cover rounded-xl shadow-md border border-slate-800 flex-shrink-0 cursor-pointer bg-slate-800 group-hover:border-indigo-500/50 transition-colors"
                    onClick={() => onSelectGameById(patch.appid)}
                  />

                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <button
                        onClick={() => onSelectGameById(patch.appid)}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 font-sans tracking-wide transition-colors"
                      >
                        {patch.gameName}
                      </button>
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] font-mono text-slate-500">AppID: {patch.appid}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formatDate(patch.date)}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {patch.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    onClick={() => onSelectGameById(patch.appid)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5 text-blue-400" />
                    <span>Telemetry</span>
                  </button>

                  {patch.url && (
                    <a
                      href={patch.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-500/30 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Full Notes</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Patch contents snippet */}
              <div className="mt-4 p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                {patch.contents.length > 350
                  ? `${patch.contents.slice(0, 350)}...`
                  : patch.contents}
              </div>

              {/* Footer tags */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-600" />
                    Author: {patch.author}
                  </span>
                  <span>•</span>
                  <span>Source: {patch.feedlabel}</span>
                </div>

                {patch.tags && patch.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {patch.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredPatches.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
              No patch notes matching your search criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
