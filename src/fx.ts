import { useEffect, useState } from 'react';
import type { Currency } from './PreferencesDialog';

type FxRow = { base?: string; quote?: string; rate?: number; date?: string };
export type FxState = { rate: number | null; date: string | null; status: 'loading' | 'ready' | 'unavailable' };

// USDT is approximately USD, but the displayed FX value is an indicative USD
// reference, never an executable USDT conversion or a guaranteed peg.
export function useFxRate(currency: Currency): FxState {
  const [state, setState] = useState<FxState>({ rate: currency === 'USDT' || currency === 'USD' ? 1 : null, date: null, status: 'loading' });
  useEffect(() => {
    if (currency === 'USDT' || currency === 'USD') { setState({ rate: 1, date: null, status: 'ready' }); return; }
    const abort = new AbortController();
    setState({ rate: null, date: null, status: 'loading' });
    fetch(`https://api.frankfurter.dev/v2/rate/USD/${currency}`, { signal: abort.signal })
      .then(async response => { if (!response.ok) throw new Error(`FX HTTP ${response.status}`); return response.json() as Promise<FxRow>; })
      .then(data => {
        if (!abort.signal.aborted) setState(Number.isFinite(data.rate) && Number(data.rate) > 0
          ? { rate: Number(data.rate), date: data.date ?? null, status: 'ready' }
          : { rate: null, date: null, status: 'unavailable' });
      })
      .catch(() => { if (!abort.signal.aborted) setState({ rate: null, date: null, status: 'unavailable' }); });
    return () => abort.abort();
  }, [currency]);
  return state;
}

export function formatReferenceMoney(usd: number, currency: Currency, rate: number | null, locale: string): string {
  if (!Number.isFinite(usd)) return '—';
  if (currency === 'USDT') return `${Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(usd)} USDT`;
  if (rate === null) return '—';
  return `${Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(usd * rate)} ${currency}`;
}
