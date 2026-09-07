import { Currency, DeckStatus, ProtonTier, VGCGrade } from '../types';

export const CURRENCY_RATES: Record<Currency, { symbol: string; rate: number; prefix: boolean }> = {
  USD: { symbol: '$', rate: 1.0, prefix: true },
  EUR: { symbol: '€', rate: 0.92, prefix: false },
  GBP: { symbol: '£', rate: 0.78, prefix: true },
  JPY: { symbol: '¥', rate: 154.5, prefix: true },
  CAD: { symbol: 'C$', rate: 1.36, prefix: true },
  AUD: { symbol: 'A$', rate: 1.52, prefix: true },
};

export function formatPrice(priceUsd: number, currency: Currency): string {
  if (priceUsd === 0) return 'Free';
  const info = CURRENCY_RATES[currency] || CURRENCY_RATES.USD;
  const converted = priceUsd * info.rate;
  
  if (currency === 'JPY') {
    return `${info.symbol}${Math.round(converted).toLocaleString()}`;
  }
  
  const formattedNum = converted.toFixed(2);
  return info.prefix ? `${info.symbol}${formattedNum}` : `${formattedNum} ${info.symbol}`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'k';
  }
  return num.toString();
}

export function getProtonTierColor(tier: ProtonTier): { bg: string; text: string; border: string; glow: string } {
  switch (tier) {
    case 'Native':
      return {
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-400',
        border: 'border-emerald-500/40',
        glow: 'shadow-emerald-500/20',
      };
    case 'Platinum':
      return {
        bg: 'bg-cyan-400/15',
        text: 'text-cyan-300',
        border: 'border-cyan-400/40',
        glow: 'shadow-cyan-400/20',
      };
    case 'Gold':
      return {
        bg: 'bg-amber-400/15',
        text: 'text-amber-300',
        border: 'border-amber-400/40',
        glow: 'shadow-amber-400/20',
      };
    case 'Silver':
      return {
        bg: 'bg-slate-300/15',
        text: 'text-slate-300',
        border: 'border-slate-300/40',
        glow: 'shadow-slate-300/20',
      };
    case 'Bronze':
      return {
        bg: 'bg-orange-700/20',
        text: 'text-orange-400',
        border: 'border-orange-600/40',
        glow: 'shadow-orange-700/20',
      };
    case 'Borked':
      return {
        bg: 'bg-red-500/15',
        text: 'text-red-400',
        border: 'border-red-500/40',
        glow: 'shadow-red-500/20',
      };
    default:
      return {
        bg: 'bg-zinc-800',
        text: 'text-zinc-400',
        border: 'border-zinc-700',
        glow: 'shadow-none',
      };
  }
}

export function getDeckStatusBadge(status: DeckStatus): { label: string; icon: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'Verified':
      return {
        label: 'Deck Verified',
        icon: 'check-circle-2',
        bg: 'bg-emerald-950/60',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
      };
    case 'Playable':
      return {
        label: 'Deck Playable',
        icon: 'info',
        bg: 'bg-amber-950/60',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
      };
    case 'Unsupported':
      return {
        label: 'Unsupported',
        icon: 'ban',
        bg: 'bg-red-950/60',
        text: 'text-red-400',
        border: 'border-red-500/30',
      };
    case 'Unknown':
    default:
      return {
        label: 'Untested',
        icon: 'help-circle',
        bg: 'bg-zinc-900',
        text: 'text-zinc-400',
        border: 'border-zinc-800',
      };
  }
}

export function getVGCGradeColor(grade: VGCGrade): { bg: string; text: string; border: string } {
  if (grade.startsWith('A')) {
    return {
      bg: 'bg-emerald-950/80',
      text: 'text-emerald-400',
      border: 'border-emerald-500/40',
    };
  }
  if (grade.startsWith('B')) {
    return {
      bg: 'bg-blue-950/80',
      text: 'text-blue-400',
      border: 'border-blue-500/40',
    };
  }
  if (grade.startsWith('C')) {
    return {
      bg: 'bg-amber-950/80',
      text: 'text-amber-400',
      border: 'border-amber-500/40',
    };
  }
  if (grade.startsWith('D')) {
    return {
      bg: 'bg-orange-950/80',
      text: 'text-orange-400',
      border: 'border-orange-500/40',
    };
  }
  return {
    bg: 'bg-red-950/80',
    text: 'text-red-400',
    border: 'border-red-500/40',
  };
}
