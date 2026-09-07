import { Currency, DeckStatus, ProtonTier } from '../types';

export const CURRENCY_SYMBOLS: Record<string, { symbol: string; prefix: boolean }> = {
  USD: { symbol: '$', prefix: true },
  EUR: { symbol: '€', prefix: false },
  GBP: { symbol: '£', prefix: true },
  JPY: { symbol: '¥', prefix: true },
  CAD: { symbol: 'C$', prefix: true },
  AUD: { symbol: 'A$', prefix: true },
  CHF: { symbol: 'CHF', prefix: true },
  RUB: { symbol: '₽', prefix: false },
  BRL: { symbol: 'R$', prefix: true },
  INR: { symbol: '₹', prefix: true },
  KRW: { symbol: '₩', prefix: true },
  TRY: { symbol: '₺', prefix: true },
  MXN: { symbol: 'Mex$', prefix: true },
  SEK: { symbol: 'kr', prefix: false },
  NOK: { symbol: 'kr', prefix: false },
  DKK: { symbol: 'kr', prefix: false },
  PLN: { symbol: 'zł', prefix: false },
  THB: { symbol: '฿', prefix: true },
  PHP: { symbol: '₱', prefix: true },
  HUF: { symbol: 'Ft', prefix: false },
  CZK: { symbol: 'Kč', prefix: false },
  ILS: { symbol: '₪', prefix: true },
  CLP: { symbol: 'CL$', prefix: true },
  PEN: { symbol: 'S/', prefix: true },
  COP: { symbol: 'COL$', prefix: true },
  AED: { symbol: 'د.إ', prefix: true },
  SAR: { symbol: '﷼', prefix: true },
};

export function formatPrice(price: number, currency: string): string {
  if (price === 0) return 'N/A';
  const info = CURRENCY_SYMBOLS[currency] || CURRENCY_SYMBOLS.USD;

  if (currency === 'JPY' || currency === 'KRW' || currency === 'THB' || currency === 'PHP' || currency === 'HUF' || currency === 'CZK') {
    return `${info.symbol}${Math.round(price).toLocaleString()}`;
  }

  const formattedNum = price.toFixed(2);
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
        border: 'border-amber-500/40',
        glow: 'shadow-amber-500/20',
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
