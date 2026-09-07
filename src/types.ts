export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'RUB' | 'BRL' | 'INR' | 'KRW' | 'TRY' | 'MXN' | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'THB' | 'PHP' | 'HUF' | 'CZK' | 'ILS' | 'CLP' | 'PEN' | 'COP' | 'AED' | 'SAR';

export type DeckStatus = 'Verified' | 'Playable' | 'Unsupported' | 'Unknown';

export type ProtonTier = 'Native' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Borked' | 'Unknown';

export interface PlayerHistoryPoint {
  time: string;
  players: number;
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
  discount: number;
}

export interface ProtonDBData {
  tier: ProtonTier;
  confidence: 'Strong' | 'High' | 'Good' | 'Moderate' | 'Unknown';
  totalReports: number;
  recommendedProton: string;
  launchOptions?: string;
  tinkerSteps: string;
  deckFpsAverage?: string;
  url: string;
}

export interface SteamGame {
  id: number; // AppID
  name: string;
  headerImage: string;
  currentPlayers: number;
  peak24h: number;
  allTimePeak: number;
  allTimePeakDate: string;
  price: number; // Localized price (matches priceCurrency)
  originalPrice: number;
  discountPercent: number;
  priceCurrency: string;
  historicalLow: number;
  historicalLowDate: string;
  positiveReviews: number;
  negativeReviews: number;
  steamRating: number; // 0-100%
  ratingStatus: 'Overwhelmingly Positive' | 'Very Positive' | 'Positive' | 'Mostly Positive' | 'Mixed';
  releaseDate: string;
  developer: string;
  publisher: string;
  genres: string[];
  tags: string[];
  deckStatus: DeckStatus;
  protonDB: ProtonDBData;
  reviewHistory: { date: string; positive: number; negative: number; rating: number }[];
  playerHistory24h: PlayerHistoryPoint[];
  playerHistory7d: PlayerHistoryPoint[];
  priceHistory: PriceHistoryPoint[];
  achievementsCount: number;
  depotsCount: number;
  dlcCount: number;
  shortDescription: string;
  minSpecs?: {
    os: string;
    processor: string;
    memory: string;
    graphics: string;
    storage: string;
  };
}

export type ActiveTab = 'charts' | 'sales' | 'proton' | 'releases';

export type ConcurrentTimeframe = 'day' | 'week' | 'month' | 'year' | 'all_time';

export interface ConcurrentHistoryPoint {
  label: string;
  players: number;
  trend: number;
  peak?: number;
  timestamp?: string;
}

export interface UpcomingSteamRelease {
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
