import type { Market } from './live';
import { installProbabilityStyles, probabilityText, validProbability } from './ProbabilityDisplay';

export function paintFrameProbability(doc: Document, host: HTMLElement, market: Market | undefined, featured = false) {
  installProbabilityStyles(doc);
  host.className = `probability-display ${featured ? 'probability-featured' : ''}`;
  host.replaceChildren();
  if (market) host.dataset.atlasMarket = market.id;
  else delete host.dataset.atlasMarket;
  const outcomes = market?.outcomes ?? [], prices = market?.prices ?? [];
  if (featured) {
    const leader = outcomes.reduce((best, _, i) => validProbability(prices[i]) && (!validProbability(prices[best]) || prices[i] > prices[best]) ? i : best, 0);
    const price = outcomes.length ? prices[leader] : undefined;
    const gauge = doc.createElement('div'); gauge.className = 'probability-gauge';
    gauge.setAttribute('role', 'img'); gauge.setAttribute('aria-label', `${outcomes[leader] ?? 'Probability'}: ${probabilityText(price)}`);
    gauge.innerHTML = `<svg viewBox="0 0 200 112" aria-hidden="true"><path d="M16 98 A84 84 0 0 1 184 98" pathLength="100" class="probability-gauge-track"/>${validProbability(price) ? `<path d="M16 98 A84 84 0 0 1 184 98" pathLength="100" class="probability-gauge-value" stroke-dasharray="${price * 100} 100"/>` : ''}</svg>`;
    const value = doc.createElement('strong'); value.textContent = probabilityText(price); gauge.appendChild(value);
    const label = doc.createElement('small'); label.textContent = outcomes[leader] ?? 'Awaiting market data'; gauge.appendChild(label);
    host.appendChild(gauge);
  }
  const comparison = doc.createElement('div'); comparison.className = 'probability-comparison';
  const caption = doc.createElement('span'); caption.className = 'probability-caption'; caption.textContent = 'CURRENT PROBABILITY'; comparison.appendChild(caption);
  if (!outcomes.length) { const empty = doc.createElement('span'); empty.textContent = 'Probability unavailable'; comparison.appendChild(empty); }
  outcomes.forEach((outcome, i) => {
    const row = doc.createElement('div'); row.className = `probability-row ${i % 2 ? 'probability-pink' : ''}`;
    const label = doc.createElement('div'); label.className = 'probability-label';
    const name = doc.createElement('span'); name.textContent = outcome;
    const value = doc.createElement('strong'); value.textContent = probabilityText(prices[i]); label.append(name, value);
    const track = doc.createElement('div'); track.className = 'probability-track'; track.setAttribute('aria-hidden', 'true');
    if (validProbability(prices[i])) { const fill = doc.createElement('span'); fill.style.width = `${prices[i] * 100}%`; track.appendChild(fill); }
    row.append(label, track); comparison.appendChild(row);
  });
  host.appendChild(comparison);
}
