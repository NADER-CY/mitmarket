import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import css from './probability.css?raw';

export function installProbabilityStyles(doc: Document) {
  if (doc.getElementById('mit-probability-style')) return;
  const style = doc.createElement('style');
  style.id = 'mit-probability-style';
  style.textContent = css;
  (doc.body ?? doc.head).appendChild(style);
}

export function validProbability(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

export function probabilityText(value: unknown) {
  return validProbability(value) ? `${(value * 100).toFixed(1)}%` : 'Unavailable';
}

export type ProbabilityMarket = { title?: string; outcomes: string[]; prices: readonly (number | null | undefined)[] };

// Each row has its own 0–100% scale. Prices are never normalized or complemented.
export function ProbabilityDisplay({ market, featured = false }: { market?: ProbabilityMarket; featured?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { if (host.current) installProbabilityStyles(host.current.ownerDocument); }, []);
  const outcomes = market?.outcomes ?? [];
  const prices = market?.prices ?? [];
  const leader = outcomes.reduce((best, _, i) => validProbability(prices[i]) && (!validProbability(prices[best]) || prices[i]! > prices[best]!) ? i : best, 0);
  const price = outcomes.length ? prices[leader] : undefined;
  return <div ref={host} className={`probability-display ${featured ? 'probability-featured' : ''}`} aria-label={market?.title ? `Current probabilities for ${market.title}` : 'Current probabilities'}>
    {featured && <div className="probability-gauge" role="img" aria-label={`${outcomes[leader] ?? 'Probability'}: ${probabilityText(price)}`}>
      <svg viewBox="0 0 200 112" aria-hidden="true"><path d="M16 98 A84 84 0 0 1 184 98" pathLength="100" className="probability-gauge-track"/>{validProbability(price) && <path d="M16 98 A84 84 0 0 1 184 98" pathLength="100" className="probability-gauge-value" strokeDasharray={`${price * 100} 100`}/>}</svg>
      <strong>{probabilityText(price)}</strong><small>{outcomes[leader] ?? 'Awaiting market data'}</small>
    </div>}
    <div className="probability-comparison">
      <span className="probability-caption">CURRENT PROBABILITY</span>
      {featured && market?.title && <span className="probability-market-title">{market.title}</span>}
      {outcomes.length ? outcomes.map((outcome, i) => <div className={`probability-row ${i % 2 ? 'probability-pink' : ''}`} key={`${i}:${outcome}`}>
        <div className="probability-label"><span>{outcome}</span><strong>{probabilityText(prices[i])}</strong></div>
        <div className="probability-track" aria-hidden="true">{validProbability(prices[i]) && <span style={{ width: `${prices[i]! * 100}%` } as CSSProperties}/>}</div>
      </div>) : <span className="probability-unavailable">Probability unavailable</span>}
    </div>
  </div>;
}
