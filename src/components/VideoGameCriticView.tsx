import { ExternalLink, Gamepad2, Search } from 'lucide-react';
import { SteamGame } from '../types';

interface VideoGameCriticViewProps {
  games: SteamGame[];
  onSelectGame: (game: SteamGame) => void;
}

export const VideoGameCriticView = ({ games, onSelectGame }: VideoGameCriticViewProps) => {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-widest mb-2">
              <Gamepad2 className="w-4 h-4" />
              <span>Independent Critic Source</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">VideoGameCritic Scores</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              VGC scores are not imported until an authorized data feed is available. Use the source links below to inspect the current review directly on VideoGamesCritic.com.
            </p>
          </div>
          <a href="https://videogamescritic.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors">
            <span>Visit VideoGamesCritic.com</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {games.map((game) => {
          const vgc = game.videoGameCritic;
          const lookupUrl = vgc?.url || `https://www.google.com/search?q=site%3Avideogamescritic.com+${encodeURIComponent(game.name)}`;
          return (
            <article key={game.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
              <button type="button" onClick={() => onSelectGame(game)} className="w-full text-left">
                <div className="flex items-center gap-3">
                  <img src={game.headerImage} alt={game.name} referrerPolicy="no-referrer" className="w-20 h-10 object-cover rounded-xl" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-100 truncate">{game.name}</h3>
                    <p className="text-[11px] text-slate-500 font-mono">Steam AppID {game.id}</p>
                  </div>
                </div>
              </button>
              <div className="mt-5 flex items-end justify-between gap-3">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">VGC score</div>
                  <div className="text-3xl font-black font-mono text-slate-300">{typeof vgc?.score === 'number' ? `${vgc.score}/100` : 'Not imported'}</div>
                </div>
                <a href={lookupUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-xs font-bold">
                  <Search className="w-3.5 h-3.5" />
                  <span>{vgc ? 'Open source' : 'Find review'}</span>
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
