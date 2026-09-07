import { useState, useEffect } from 'react';
import { ActiveTab, Currency, SteamGame } from './types';
import { Header } from './components/Header';
import { ChartsView } from './components/ChartsView';
import { SalesView } from './components/SalesView';
import { ProtonDBHub } from './components/ProtonDBHub';
import { ReleasesView } from './components/ReleasesView';
import { GameDetailModal } from './components/GameDetailModal';
import { Footer } from './components/Footer';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('charts');
  const [games, setGames] = useState<SteamGame[]>([]);
  const [selectedGame, setSelectedGame] = useState<SteamGame | null>(null);

  // Currency persistence
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('steamdb_currency');
    return (saved as Currency) || 'USD';
  });

  // Save currency
  useEffect(() => {
    localStorage.setItem('steamdb_currency', currency);
  }, [currency]);

  // Load the dashboard entirely from Steam at startup and refresh live counts.
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/steam/dashboard');
        if (!res.ok) return;
        const data = await res.json();
        if (data?.success && Array.isArray(data.games)) setGames(data.games);
      } catch {
        // Keep the empty state when Steam is unavailable.
      }
    };

    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut support: Escape closes modal, "/" focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedGame(null);
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        document.getElementById('global-game-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync selectedGame with live updates
  const activeSelectedGame = selectedGame 
    ? games.find((g) => g.id === selectedGame.id) || selectedGame 
    : null;

  // Dynamically load any game from the entire Steam store by AppID
  const handleSelectGameById = async (appId: number) => {
    try {
      const res = await fetch(`/api/steam/game/${appId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.game) {
          const newGame: SteamGame = data.game;
          setGames((prev) => [newGame, ...prev.filter((g) => g.id !== newGame.id)]);
          setSelectedGame(newGame);
        }
      } else {
        const existing = games.find((g) => g.id === appId);
        if (existing) setSelectedGame(existing);
      }
    } catch (err) {
      console.warn('Failed to fetch full live Steam game details:', err);
      const existing = games.find((g) => g.id === appId);
      if (existing) setSelectedGame(existing);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        games={games}
        onSelectGame={(game) => handleSelectGameById(game.id)}
        onSelectGameById={handleSelectGameById}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'charts' && (
          <ChartsView
            games={games}
            currency={currency}
            onSelectGame={(game) => handleSelectGameById(game.id)}
          />
        )}

        {activeTab === 'sales' && (
          <SalesView
            games={games}
            currency={currency}
            onSelectGame={(game) => handleSelectGameById(game.id)}
          />
        )}

        {activeTab === 'proton' && (
          <ProtonDBHub
            games={games}
            onSelectGame={(game) => handleSelectGameById(game.id)}
          />
        )}


        {activeTab === 'releases' && (
          <ReleasesView onSelectGame={(game) => handleSelectGameById(game.id)} />
        )}
      </main>

      {/* Game Detail Inspector Modal */}
      {activeSelectedGame && (
        <GameDetailModal
          game={activeSelectedGame}
          onClose={() => setSelectedGame(null)}
          currency={currency}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
