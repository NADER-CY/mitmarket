import { useEffect, useMemo, useState } from 'react';
import type { Market } from './live';

type Range = '1h' | '6h' | '1d' | '1w' | '1m' | 'max';
type Point = { t: number; p: number };
const ranges: Range[] = ['1h', '6h', '1d', '1w', '1m', 'max'];

export function MarketChart({ market }: { market: Market }) {
  const [range, setRange] = useState<Range>('1w');
  const [outcome, setOutcome] = useState(0);
  const [history, setHistory] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = market.tokenIds[outcome];

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setHistory([]); setError('');
    if (!token) { setLoading(false); setError('This market has no CLOB token'); return () => controller.abort(); }
    const url = new URL('https://clob.polymarket.com/prices-history');
    url.searchParams.set('market', token);
    url.searchParams.set('interval', range);
    url.searchParams.set('fidelity', range === '1h' ? '1' : range === '6h' ? '5' : range === '1d' ? '10' : range === '1w' ? '60' : '240');
    fetch(url, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error(`CLOB history: HTTP ${response.status}`);
      const json = await response.json() as { history?: Point[] };
      const points = (json.history ?? []).filter(p => Number.isFinite(Number(p.p)) && Number.isFinite(Number(p.t))).map(p => ({ t: Number(p.t), p: Number(p.p) })).sort((a, b) => a.t - b.t);
      if (!controller.signal.aborted) { setHistory(points); setLoading(false); }
    }).catch(cause => { if (!controller.signal.aborted) { setError(cause instanceof Error ? cause.message : 'Price history unavailable'); setLoading(false); } });
    return () => controller.abort();
  }, [token, range]);

  const chart = useMemo(() => {
    if (!history.length) return null;
    const now = Math.floor(Date.now()/1000);
    const current = market.prices[outcome];
    const series = Number.isFinite(current) && current>=0 && current<=1 ? [...history,{t:Math.max(now,history[history.length-1].t+1),p:current}] : history;
    const values = series.map(p => p.p);
    const lo = Math.max(0, Math.min(...values) - 0.04);
    const hi = Math.min(1, Math.max(...values) + 0.04);
    const span = Math.max(0.01, hi - lo);
    const x0 = series[0].t;
    const xSpan = Math.max(1, series[series.length - 1].t - x0);
    const points = series.map(p => `${40 + (p.t - x0) / xSpan * 860},${295 - ((p.p - lo) / span) * 240}`).join(' ');
    const end = series[series.length - 1];
    return { lo, hi, points, end, start: history[0] };
  }, [history,market.prices,outcome]);

  return <div className="market-chart">
    <div className="chart-head"><div><span className="caption">HISTORICAL PROBABILITY · CLOB</span><h3>{market.outcomes[outcome] ?? 'Outcome'} — {chart ? `${(chart.end.p * 100).toFixed(2)}%` : '—'}</h3></div>
      <div className="range-buttons">{ranges.map(r => <button key={r} className={r === range ? 'active' : ''} onClick={() => setRange(r)}>{r.toUpperCase()}</button>)}</div>
    </div>
    <div className="outcome-tabs">{market.outcomes.map((label, i) => <button key={label} className={outcome === i ? 'active' : ''} onClick={() => setOutcome(i)}>{label} {Number.isFinite(market.prices[i]) ? `${(market.prices[i] * 100).toFixed(1)}%` : ''}</button>)}</div>
    <div className="chart-canvas">
      {loading ? <p className="chart-message">Loading verified CLOB price history…</p> : error ? <p className="chart-message error">{error}</p> : !chart ? <p className="chart-message">No historical price points available for this range.</p> :
        <svg className="chart-svg" viewBox="0 0 960 340" preserveAspectRatio="none" role="img" aria-label={`${market.title} historical probability chart`}>
          {[0, 1, 2, 3, 4].map(i => { const y = 55 + i * 60; const percent = chart.hi - (i / 4) * (chart.hi - chart.lo); return <g key={i}><line x1="40" y1={y} x2="900" y2={y} stroke="#29313D" strokeDasharray="3 5"/><text x="907" y={y + 4} fill="#929aaa" fontSize="12">{(percent * 100).toFixed(0)}%</text></g>; })}
          <defs><linearGradient id="chartfill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#0bba74" stopOpacity=".28"/><stop offset="1" stopColor="#0bba74" stopOpacity="0"/></linearGradient></defs>
          <polygon points={`40,305 ${chart.points} 900,305`} fill="url(#chartfill)" />
          <polyline points={chart.points} fill="none" stroke="#0bba74" strokeWidth="2.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx="900" cy={295 - ((chart.end.p - chart.lo) / (chart.hi - chart.lo)) * 240} r="4" fill="#0bba74" />
          <text x="40" y="330" fill="#929aaa" fontSize="12">{new Date(chart.start.t * 1000).toLocaleDateString()}</text>
          <text x="900" y="330" fill="#929aaa" fontSize="12" textAnchor="end">{new Date(chart.end.t * 1000).toLocaleDateString()}</text>
        </svg>}
    </div>
    <p className="chart-foot">Historical market prices and latest updates when available. No chart movement is simulated. Not investment advice.</p>
  </div>;
}
