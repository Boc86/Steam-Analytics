import { useState, useMemo } from 'react';
import { 
  Gamepad2, 
  ExternalLink, 
  Award, 
  ThumbsUp, 
  ThumbsDown, 
  Quote, 
  Sparkles,
  Calendar,
  Filter
} from 'lucide-react';
import { SteamGame, VGCGrade } from '../types';
import { getVGCGradeColor, formatPrice } from '../utils/formatters';

interface VideoGameCriticViewProps {
  games: SteamGame[];
  onSelectGame: (game: SteamGame) => void;
}

export const VideoGameCriticView = ({ games, onSelectGame }: VideoGameCriticViewProps) => {
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  // Games that have VideoGameCritic data
  const criticGames = useMemo(() => {
    return games.filter((g) => {
      if (!g.videoGameCritic) return false;
      if (gradeFilter === 'all') return true;
      if (gradeFilter === 'A') return g.videoGameCritic.grade.startsWith('A');
      if (gradeFilter === 'B') return g.videoGameCritic.grade.startsWith('B');
      if (gradeFilter === 'C') return g.videoGameCritic.grade.startsWith('C');
      return true;
    });
  }, [games, gradeFilter]);

  return (
    <div className="space-y-6">
      {/* VGC Feature Hero Bento Banner */}
      <div className="relative rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 bg-gradient-to-l from-amber-500 via-blue-500 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-widest mb-2">
              <Gamepad2 className="w-4 h-4" />
              <span>Independent Critic Intelligence</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              The Video Games Critic (VGC) Scores & Reviews
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              Frank, honest, and unvarnished video game critique and retro perspectives provided by{' '}
              <a 
                href="https://videogamescritic.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-400 font-semibold underline underline-offset-4 hover:text-amber-300 inline-flex items-center gap-0.5"
              >
                The Video Games Critic (videogamescritic.com) <ExternalLink className="w-3 h-3" />
              </a>
              . Active since 1999, VGC features no-hype letter grades, candid analysis, and practical pros/cons from genuine gaming experience.
            </p>

            <div className="mt-5 flex items-center gap-3 flex-wrap text-xs">
              <a
                href="https://videogamescritic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
              >
                <span>Visit VideoGamesCritic.com</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <span className="text-slate-400 border-l border-slate-800 pl-3">
                Over <strong className="text-white font-mono">4,000+</strong> reviews published since the 90s retro era
              </span>
            </div>
          </div>

          {/* Letter Grade Scale Guide - Bento Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 min-w-[260px] shadow-lg">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>VGC Grading System</span>
              <Award className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 font-mono">A / A+</span>
                <span className="text-slate-300">Must-Play Masterpiece</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-400 font-mono">B / B+</span>
                <span className="text-slate-300">Very Solid & Entertaining</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 font-mono">C / C+</span>
                <span className="text-slate-300">Average / Flawed Fun</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-red-400 font-mono">D / F</span>
                <span className="text-slate-300">Frustrating or Broken</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-2 overflow-x-auto scrollbar-none shadow-lg">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 flex-shrink-0 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-blue-400" /> Filter by Grade:
        </span>

        <button
          onClick={() => setGradeFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            gradeFilter === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          All Reviews ({games.filter(g => g.videoGameCritic).length})
        </button>

        <button
          onClick={() => setGradeFilter('A')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            gradeFilter === 'A'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'bg-slate-950 text-emerald-400 hover:bg-emerald-500/10 border border-slate-800'
          }`}
        >
          A-Tier Masterpieces
        </button>

        <button
          onClick={() => setGradeFilter('B')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            gradeFilter === 'B'
              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
              : 'bg-slate-950 text-blue-400 hover:bg-blue-500/10 border border-slate-800'
          }`}
        >
          B-Tier Solid Titles
        </button>

        <button
          onClick={() => setGradeFilter('C')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            gradeFilter === 'C'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'bg-slate-950 text-amber-300 hover:bg-amber-500/10 border border-slate-800'
          }`}
        >
          C-Tier Reviews
        </button>
      </div>

      {/* Review Cards Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {criticGames.map((game) => {
          if (!game.videoGameCritic) return null;
          const vgc = game.videoGameCritic;
          const vgcColor = getVGCGradeColor(vgc.grade);

          return (
            <div
              key={game.id}
              onClick={() => onSelectGame(game)}
              className="rounded-3xl border border-slate-800 bg-slate-900 hover:border-blue-500/50 transition-all p-6 flex flex-col justify-between group cursor-pointer shadow-xl"
            >
              <div>
                {/* Header: Game + Grade Seal */}
                <div className="flex items-start justify-between gap-4 mb-4">
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
                        <span>Platform: <strong className="text-slate-300">{vgc.platformReviewed}</strong></span>
                        <span>•</span>
                        <span>{vgc.reviewDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Iconic Grade Seal */}
                  <div className={`w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center font-black shadow-lg flex-shrink-0 ${vgcColor.bg} ${vgcColor.text} ${vgcColor.border}`}>
                    <span className="text-base font-mono leading-none">{vgc.grade}</span>
                    <span className="text-[8px] uppercase tracking-tighter opacity-80">Grade</span>
                  </div>
                </div>

                {/* Review Excerpt */}
                <div className="relative bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-4 text-xs text-slate-300 leading-relaxed">
                  <Quote className="w-5 h-5 text-amber-500/30 absolute top-2.5 right-2.5" />
                  <p className="italic text-slate-200 pr-6">
                    "{vgc.excerpt}"
                  </p>
                  {vgc.reviewerScoreLabel && (
                    <div className="mt-2 text-[11px] font-bold text-amber-400 font-mono">
                      Rating Verdict: {vgc.reviewerScoreLabel}
                    </div>
                  )}
                </div>

                {/* Pros & Cons List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
                  {/* Pros */}
                  <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-2 uppercase text-[10px] tracking-wider">
                      <ThumbsUp className="w-3 h-3" /> Highlights
                    </div>
                    <ul className="space-y-1 text-slate-300 text-[11px]">
                      {(vgc.pros || []).map((pro, i) => (
                        <li key={`vgc-pro-${game.id}-${i}`} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-1.5 text-red-400 font-bold mb-2 uppercase text-[10px] tracking-wider">
                      <ThumbsDown className="w-3 h-3" /> Critiques
                    </div>
                    <ul className="space-y-1 text-slate-300 text-[11px]">
                      {(vgc.cons || []).map((con, i) => (
                        <li key={`vgc-con-${game.id}-${i}`} className="flex items-start gap-1.5">
                          <span className="text-red-400 font-bold">•</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
                <span className="text-slate-500 text-[11px]">
                  Archived from The Video Games Critic
                </span>

                <a
                  href={vgc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white transition-all font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  <span>Read on VideoGamesCritic.com</span>
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
