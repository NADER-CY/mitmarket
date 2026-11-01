import { useEffect, useMemo, useState } from 'react';
import { languages, type Language } from './i18n';
import type { FxState } from './fx';

export const currencies = [
  ['USDC','USDC — USD Coin'], ['USD','USD — US Dollar'], ['EUR','EUR — Euro'],
  ['GBP','GBP — British Pound'], ['TRY','TRY — Turkish Lira'], ['AZN','AZN — Azerbaijani Manat'],
  ['IRR','IRR — Iranian Rial'], ['AED','AED — UAE Dirham'], ['SAR','SAR — Saudi Riyal'],
  ['JPY','JPY — Japanese Yen'], ['CNY','CNY — Chinese Yuan'], ['KRW','KRW — Korean Won'],
  ['INR','INR — Indian Rupee'], ['CAD','CAD — Canadian Dollar'], ['AUD','AUD — Australian Dollar'],
  ['CHF','CHF — Swiss Franc'], ['BRL','BRL — Brazilian Real'], ['RUB','RUB — Russian Ruble'],
] as const;
export type Currency = (typeof currencies)[number][0];

export function PreferencesDialog({ language, currency, fx, onLanguage, onCurrency, onClose }: {
  language: Language; currency: Currency; onLanguage: (value: Language) => void;
  fx: FxState; onCurrency: (value: Currency) => void; onClose: () => void;
}) {
  const [tab, setTab] = useState<'language'|'currency'>('language');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [onClose]);
  const items = useMemo(() => (tab === 'language' ? languages : currencies).filter(([,label]) => label.toLowerCase().includes(query.toLowerCase())), [query, tab]);
  return <div className="preferences-overlay" onClick={onClose}>
    <section className="preferences-dialog" role="dialog" aria-modal="true" aria-label="Language and Currency" onClick={event => event.stopPropagation()}>
      <div className="preferences-tabs">
        <button className={tab === 'language' ? 'active' : ''} onClick={() => {setTab('language');setQuery('');}}>Language</button>
        <button className={tab === 'currency' ? 'active' : ''} onClick={() => {setTab('currency');setQuery('');}}>Currency</button>
        <button className="preferences-close" aria-label="Close" onClick={onClose}>×</button>
      </div>
      <div className="preferences-search"><span aria-hidden="true">⌕</span><input value={query} onChange={event => setQuery(event.target.value)} autoFocus aria-label={tab === 'language' ? 'Search Language' : 'Search Currency'} placeholder={tab === 'language' ? 'Search Language' : 'Search Currency'}/></div>
      <div className="preferences-grid">
        {items.map(([code,label]) => <button key={code} className={(tab === 'language' ? language : currency) === code ? 'selected' : ''} onClick={() => {if(tab === 'language') onLanguage(code as Language); else onCurrency(code as Currency); onClose();}}>{label}</button>)}
        {items.length === 0 && <p className="preferences-empty">No results</p>}
      </div>
      {tab === 'currency' && <p className="preferences-note">{fx.status === 'ready' ? (fx.date ? `Indicative USD reference rate from ${fx.date}: 1 USD ≈ ${fx.rate} ${currency}. ` : '') : fx.status === 'loading' ? 'Loading reference FX rate… ' : 'Reference FX rate unavailable for this currency. '}Only market volumes use reference FX conversion; contract prices remain in USDC. Rates are not executable quotes.</p>}
    </section>
  </div>;
}
