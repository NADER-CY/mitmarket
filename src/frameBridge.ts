import { useEffect, useState, type RefObject } from 'react';
import { categories, type CategoryId } from './categories';
import type { Market } from './live';
import { formatReferenceMoney } from './fx';
import type { Currency } from './PreferencesDialog';

type Point = { t: number; p: number };
type FrameOptions = {
  frame: RefObject<HTMLIFrameElement | null>; screen: string; category: CategoryId;
  markets: Market[]; selected?: Market; viewport: string;
  onCategory: (id: CategoryId) => void; onMarket: (id: string) => void;
  onTrending: () => void;
  currency: Currency; fxRate: number | null; language: string;
};

function percent(value: number | undefined) { return Number.isFinite(value) ? `${Math.round(Number(value) * 100)}%` : '—'; }
function cents(value: number | undefined) { return Number.isFinite(value) ? `${Math.round(Number(value) * 100)}¢` : '—'; }
function usd(value: number) { return `$${Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)}`; }

function paintHome(doc: Document, markets: Market[], currency: Currency, fxRate: number | null, language: string) {
  const questions = [...doc.querySelectorAll<HTMLElement>('main h1, main h2, main h3')];
  questions.forEach((element, i) => {
    const market = markets[i]; if (!market) return;
    element.textContent = market.title;
    element.dataset.atlasMarket = market.id;
    element.style.cursor = 'pointer';
    let card: HTMLElement | null = element.parentElement;
    while (card && (card.querySelectorAll('h1,h2,h3').length !== 1 || ![...card.querySelectorAll('button')].some(button => /\bYES\b|\bNO\b/i.test(button.textContent ?? '')))) card = card.parentElement;
    if (!card) return;
    const buttons = [...card.querySelectorAll<HTMLButtonElement>('button')].filter(button => /\bYES\b|\bNO\b|Buy YES|Buy NO/i.test(button.textContent ?? ''));
    buttons.forEach(button => {
      const outcome = /\bNO\b/i.test(button.textContent ?? '') ? 1 : 0;
      const price = market.prices[outcome];
      const walker = doc.createTreeWalker(button, NodeFilter.SHOW_TEXT);
      let node: Node | null; let updated = false;
      while ((node = walker.nextNode())) {
        if (/\d+(?:\.\d+)?¢/.test(node.textContent ?? '')) {
          node.textContent = (node.textContent ?? '').replace(/\d+(?:\.\d+)?¢/, cents(price));
          updated = true; break;
        }
      }
      if (!updated) button.textContent = `${market.outcomes[outcome] ?? (outcome ? 'NO' : 'YES')} ${cents(price)}`;
      button.dataset.atlasMarket = market.id;
    });
    const walker = doc.createTreeWalker(card, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (buttonParent(node)) continue;
      const original = node.textContent ?? '';
      let revised = original.replace(/YES\s+\d+(?:\.\d+)?%/g, `YES ${percent(market.prices[0])}`).replace(/NO\s+\d+(?:\.\d+)?%/g, `NO ${percent(market.prices[1])}`);
      if (/\bVol\b/.test(original) && (/\$[\d,.]+\s*[MBK]?\s*Vol/.test(original) || node.parentElement?.dataset.atlasFxVolume === market.id)) {
        revised = original.replace(/(?:\$[\d,.]+\s*[MBK]?|[\d,.]+\s*[\w]+)\s*Vol/, `${formatReferenceMoney(market.volume24h,currency,fxRate,language)} Vol`);
        if (node.parentElement) node.parentElement.dataset.atlasFxVolume = market.id;
      }
      if (/^\s*(CRYPTO|POLICY|SPORTS|GEOPOLITICS|FINANCE|TECH\s*&\s*AI|MACRO\s*\/\s*ECONOMY)\s*$/i.test(original)) revised = market.category.toUpperCase();
      if (market.endDate && /^\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+20\d{2}\s*$/.test(original)) revised = new Date(market.endDate).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'});
      if (revised !== original) node.textContent = revised;
    }
  });
  const hero = questions[0];
  if (hero && markets[0]) {
    const description = hero.nextElementSibling;
    if (description?.tagName === 'P') description.textContent = 'Live probability updates across MITMARKET markets.';
    const metric = [...doc.querySelectorAll<HTMLElement>('main span,main div')].find(el => el.children.length === 0 && el.textContent?.trim() === '68%');
    if (metric) metric.textContent = percent(markets[0].prices[0]);
  }
}

function buttonParent(node: Node) { return Boolean((node.parentElement)?.closest('button')); }

function paintMobileTrending(doc:Document, markets:Market[], currency:Currency, fxRate:number|null, language:string){
  if(!markets.length)return;
  const byTitle=new Map<string,Market>();
  for(const market of markets)if(!byTitle.has(market.eventTitle||market.title))byTitle.set(market.eventTitle||market.title,market);
  const buckets=new Map<string,Market[]>();
  for(const market of byTitle.values()){
    const bucket=buckets.get(market.category)||[];
    bucket.push(market);buckets.set(market.category,bucket);
  }
  const selected:Market[]=[];
  while(selected.length<27 && [...buckets.values()].some(bucket=>bucket.length)){
    for(const bucket of buckets.values()){
      if(bucket.length && selected.length<27)selected.push(bucket.shift()!);
    }
  }
  const primary=selected[0];
  const hero=doc.querySelector('main h1,main h2');
  if(hero)hero.textContent=primary.title;
  const leaves=[...doc.querySelectorAll<HTMLElement>('main *')].filter(node=>!node.children.length);
  const replaceText=(oldValue:string,newValue:string)=>{const node=leaves.find(item=>item.textContent?.trim()===oldValue);if(node)node.textContent=newValue;};
  replaceText('MACRO / ECONOMY',primary.category.toUpperCase());
  replaceText('$34.2M Vol',`${formatReferenceMoney(primary.volume24h,currency,fxRate,language)} Vol`);
  replaceText('68%',percent(primary.prices[0]));
  const drift=leaves.find(node=>node.textContent?.includes('+4.2%'));
  if(drift)drift.textContent=' LIVE';
  replaceText('24h implied drift','Current market odds');
  const heroButtons=[...doc.querySelectorAll<HTMLButtonElement>('main button')].filter(button=>/Buy YES|Buy NO/.test(button.textContent||''));
  heroButtons.slice(0,2).forEach((button,i)=>{
    const price=button.querySelector<HTMLElement>('.font-mono');if(price)price.textContent=cents(primary.prices[i]);
    button.dataset.atlasMarket=primary.id;
  });
  const quickTitle=[...doc.querySelectorAll<HTMLElement>('main span')].find(node=>/High Liquidity Fast-Tack/i.test(node.textContent||''));
  const quickGrid=quickTitle?.parentElement?.nextElementSibling;
  const quickCards=[...(quickGrid?.children??[])] as HTMLElement[];
  quickCards.forEach((card,i)=>{
    const m=selected[i+1];if(!m)return;
    const title=card.querySelector<HTMLElement>('.line-clamp-2');if(title)title.textContent=m.title;
    const bars=card.querySelectorAll<HTMLElement>('.h-full');
    if(bars[0])bars[0].style.width=`${Math.max(0,Math.min(100,(m.prices[0]||0)*100))}%`;
    if(bars[1])bars[1].style.width=`${Math.max(0,Math.min(100,(m.prices[1]||0)*100))}%`;
    const values=card.querySelectorAll<HTMLElement>('.font-mono span');
    if(values[0])values[0].textContent=`${cents(m.prices[0])} YES`;
    if(values[1])values[1].textContent=`${formatReferenceMoney(m.volume24h,currency,fxRate,language)} Vol`;
    if(values[2])values[2].textContent=`${cents(m.prices[1])} NO`;
    card.dataset.atlasMarket=m.id;card.style.cursor='pointer';
  });
  const heading=[...doc.querySelectorAll('main h3')].find(node=>/Trending Prediction Markets/i.test(node.textContent||''));
  const section=heading?.parentElement?.parentElement?.parentElement;
  const list=section?.querySelector<HTMLElement>(':scope > .flex.flex-col.gap-space-sm');
  if(list){
    const template=list.firstElementChild;
    if(template){while(list.children.length<Math.min(24,Math.max(5,selected.length-3)))list.appendChild(template.cloneNode(true));}
    [...list.children].forEach((node,i)=>{
      const m=selected[i+3];const card=node as HTMLElement;
      if(!m){card.hidden=true;return;}card.hidden=false;
      const title=card.querySelector('p');if(title)title.textContent=m.title;
      const category=card.querySelector<HTMLElement>('.uppercase');if(category)category.textContent=m.category;
      const volume=card.querySelector<HTMLElement>('.shrink-0.bg-surface-container-high');if(volume)volume.textContent=formatReferenceMoney(m.volume24h,currency,fxRate,language);
      const buttons=[...card.querySelectorAll<HTMLButtonElement>('button')];
      buttons.slice(0,2).forEach((button,outcome)=>{
        button.textContent=`${m.outcomes[outcome]|| (outcome?'NO':'YES')} ${percent(m.prices[outcome])}  ·  ${cents(m.prices[outcome])}`;
        button.dataset.atlasMarket=m.id;
      });
      buttons.slice(2).forEach(button=>{button.hidden=true;button.style.display='none';});
      card.dataset.atlasMarket=m.id;card.style.cursor='pointer';
    });
  }
  const seeAll=heading?.parentElement?.parentElement?.querySelector('button');
  if(seeAll)seeAll.textContent=`See all (${markets.length})`;
  const telemetry=leaves.find(node=>node.textContent?.trim()==='Engine Telemetry');
  if(telemetry){telemetry.textContent='LIVE MARKET DATA';const container=telemetry.parentElement?.parentElement;
    if(container){
      const fields=[...container.querySelectorAll<HTMLElement>('.grid > div')];
      const values=[formatReferenceMoney(markets.reduce((sum,m)=>sum+m.volume24h,0),currency,fxRate,language),String(markets.length),'LIVE'];
      const labels=['Tracked 24h Vol','Markets Loaded','Data Status'];
      fields.forEach((field,i)=>{if(i>2)return;const label=field.children[0];const value=field.children[1];if(label)label.textContent=labels[i];if(value)value.textContent=values[i];});
    }}
}

function paintExplore(doc: Document, markets: Market[], category: CategoryId, currency: Currency, fxRate: number | null, language: string) {
  const title = doc.querySelector('main h1');
  if (title) title.textContent = `${categories.find(c => c.id === category)?.label ?? 'Explore'} Markets`;
  const rows = [...doc.querySelectorAll<HTMLTableRowElement>('table tbody tr')];
  rows.forEach((row, i) => {
    const market = markets[i];
    if (!market) { row.hidden = true; return; }
    row.hidden = false;
    const cells = row.cells;
    const titleLink = cells[0]?.querySelector('a');
    if (titleLink) { titleLink.textContent = market.title; titleLink.dataset.atlasMarket = market.id; }
    if (cells[1]) cells[1].textContent = `${market.outcomes[0] ?? 'YES'} (${percent(market.prices[0])})`;
    if (cells[2]) cells[2].textContent = `${cents(market.prices[0])} · ${market.outcomes[1] ?? 'NO'} ${cents(market.prices[1])}`;
    if (cells[3]) cells[3].textContent = '—';
    if (cells[4]) cells[4].textContent = formatReferenceMoney(market.volume24h,currency,fxRate,language);
    if (cells[5]) cells[5].textContent = '—';
    if (cells[6]) cells[6].textContent = market.endDate ? new Date(market.endDate).toLocaleDateString('en-US') : '—';
    const subtitle = cells[0]?.querySelector('a')?.nextElementSibling;
    if (subtitle) subtitle.textContent = 'MITMARKET market probability reference';
    for (const button of cells[7]?.querySelectorAll('button') ?? []) {
      button.dataset.atlasMarket = market.id;
      const isNo = /\bNO\b/i.test(button.textContent ?? '');
      button.textContent = `${isNo ? 'NO' : 'YES'} ${cents(market.prices[isNo ? 1 : 0])}`;
    }
  });
  const leafNodes = [...doc.querySelectorAll<HTMLElement>('main *')].filter(el => el.children.length === 0);
  for (const node of leafNodes) {
    const value = node.textContent?.trim();
    if (value === '2,419') node.textContent = String(markets.length);
    if (value === '$482.1M' || value === '14,209') node.textContent = '—';
    if (value === 'TOTAL CONTRACTS') node.textContent = 'LOADED CONTRACTS';
  }
}

function paintDetail(doc: Document, market: Market, history: Point[]) {
  const question = doc.querySelector('main h1'); if (question) question.textContent = market.title;
  // The Stitch reference contains illustrative trades, resolution terms and a
  // fictional featured commenter. Never present those as live market records.
  const sampleComment=[...doc.querySelectorAll<HTMLElement>('main span')].find(el=>el.textContent?.trim()==='Market Consensus & Commentary');
  if(sampleComment)sampleComment.closest('.space-y-3.pt-2')?.setAttribute('hidden','');
  const sampleRules=[...doc.querySelectorAll<HTMLElement>('main h3')].find(el=>el.textContent?.includes('Resolution Rules & Settlement Criterion'));
  if(sampleRules){const body=sampleRules.parentElement?.parentElement?.querySelector('p');if(body)body.textContent='Resolution criteria must be verified against the original market rules before trading. This preview does not execute orders.';}
  const orderBook=[...doc.querySelectorAll<HTMLElement>('main span')].find(el=>el.textContent?.trim()==='Level 2 Depth Ladder');
  if(orderBook){const area=orderBook.closest('.rounded-xl');if(area)area.setAttribute('hidden','');}
  const identity=doc.querySelector<HTMLElement>('main section .w-13');
  if(identity&&market.image){
    identity.replaceChildren();const img=doc.createElement('img');img.src=market.image;img.alt=market.eventTitle;img.referrerPolicy='no-referrer';
    img.style.cssText='height:100%;width:100%;object-fit:cover;border-radius:10px';identity.appendChild(img);
  }
  const categoryLabel=doc.querySelector('main section .uppercase.tracking-wider');
  if(categoryLabel&&categoryLabel.textContent?.trim()==='Crypto')categoryLabel.textContent=market.category;
  const probability = percent(market.prices[0]);
  const metricElements = [...doc.querySelectorAll<HTMLElement>('main *')].filter(el => el.children.length === 0);
  metricElements.forEach(el => {
    const value = (el.textContent ?? '').trim();
    if (value === '72%' || value === '72.4% Probability ($0.72)') el.textContent = probability;
    if (value === '(72¢)' || value === '72¢') el.textContent = cents(market.prices[0]);
    if (value === '$31,482,900' || value === '$2.4M') el.textContent = usd(market.volume24h);
    if (['+3.4%', '$8,940,210 USDC', '$14.2M', '74¢ / 68¢', '$97,420.50', '+24.4% 30d'].includes(value)) el.textContent = '—';
  });
  const yes = doc.getElementById('btn-outcome-yes');
  const no = doc.getElementById('btn-outcome-no');
  if (yes) yes.textContent = `YES ${cents(market.prices[0])}`;
  if (no) no.textContent = `NO ${cents(market.prices[1])}`;
  const svg = doc.querySelector<SVGSVGElement>('main svg[viewBox="0 0 800 320"],main svg[viewBox="0 0 350 160"]');
  const livePrice = market.prices[0];
  const series = history.length >= 2 && Number.isFinite(livePrice) ? [...history,{t:Math.max(Date.now()/1000,history[history.length-1].t+1),p:livePrice}] : history;
  if (svg && series.length >= 2) {
    const desktop = svg.viewBox.baseVal.width === 800;
    const width = desktop ? 800 : 325;
    const floor = desktop ? 280 : 150;
    const height = desktop ? 260 : 130;
    const start = series[0].t; const duration = Math.max(1, series[series.length - 1].t - start);
    const points = series.map(p => ({x:((p.t - start) / duration * width),y:(floor - Math.max(0, Math.min(1, p.p)) * height)}));
    const path = points.map((point,i) => `${i ? 'L' : 'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
    if (desktop) {
      const line = svg.querySelector('polyline'); if (line) line.setAttribute('points',points.map(p=>`${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '));
      const area = svg.querySelector('polygon'); if (area) area.setAttribute('points', `0,${floor} ${points.map(p=>`${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')} ${width},${floor}`);
    } else {
      const mainLine = svg.querySelector<SVGPathElement>('path[stroke]:not([stroke="none"])');
      const mainArea = svg.querySelector<SVGPathElement>('path[fill^="url"]');
      if (mainLine) mainLine.setAttribute('d',path);
      if (mainArea) mainArea.setAttribute('d',`${path} L${width},${floor} L0,${floor} Z`);
      const marker = svg.querySelector<SVGCircleElement>('circle:not(.animate-ping)');
      if (marker) { marker.setAttribute('cx',String(points.at(-1)?.x ?? width));marker.setAttribute('cy',String(points.at(-1)?.y ?? floor)); }
    }
    svg.setAttribute('aria-label',`Historical market probability with live price for ${market.title}`);
  }
}

export function useFrameBridge({ frame, screen, category, markets, selected, viewport, onCategory, onMarket, onTrending, currency, fxRate, language }: FrameOptions) {
  const [loaded, setLoaded] = useState(0);
  const [range, setRange] = useState('1w');
  const [history, setHistory] = useState<Point[]>([]);

  useEffect(() => {
    if (!selected?.tokenIds[0] || screen !== 'binary_market') { setHistory([]); return; }
    const controller = new AbortController();
    const url = new URL('https://clob.polymarket.com/prices-history');
    url.searchParams.set('market', selected.tokenIds[0]);
    url.searchParams.set('interval', range);
    url.searchParams.set('fidelity', range === '1h' ? '1' : range === '1d' ? '10' : range === '1w' ? '60' : '240');
    fetch(url, { signal: controller.signal }).then(response => { if (!response.ok) throw Error('Chart unavailable'); return response.json(); }).then((body: {history?: Point[]}) => {
      if (!controller.signal.aborted) setHistory((body.history ?? []).filter(p => Number.isFinite(p.t) && Number.isFinite(p.p)));
    }).catch(() => { if (!controller.signal.aborted) setHistory([]); });
    return () => controller.abort();
  }, [selected?.tokenIds[0], range, screen]);

  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (!doc?.body) return;
    if (screen === 'home') paintHome(doc, markets, currency, fxRate, language);
    if (screen === 'trending' && viewport === 'mobile') paintMobileTrending(doc,markets,currency,fxRate,language);
    if (screen === 'explore' && !doc.querySelector('.cr-page')) paintExplore(doc, markets, category, currency, fxRate, language);
    if (screen === 'binary_market' && selected) paintDetail(doc, selected, history);
  }, [frame, screen, viewport, category, markets, selected, history, loaded, currency, fxRate, language]);

  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (!doc?.body) return;
    const handler = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const control = target?.closest<HTMLElement>('a,button,[data-atlas-market]');
      if (!control) return;
      if (control.closest('#mit-market-navigation,.mit-category-menu')) return;
      const market = control.closest<HTMLElement>('[data-atlas-market]')?.dataset.atlasMarket;
      if (market) { event.preventDefault(); event.stopPropagation(); onMarket(market); return; }
      if (control.closest<HTMLElement>('[data-atlas-original-label]')?.dataset.atlasOriginalLabel === 'Trending' || control.textContent?.trim() === 'Trending') {
        event.preventDefault();event.stopPropagation();onTrending();return;
      }
      const categoryPath = control.closest<HTMLElement>('[data-path]')?.dataset.path;
      const pathCategory = categories.find(c => c.id === categoryPath || c.label.toLowerCase() === categoryPath?.toLowerCase());
      if (pathCategory) { event.preventDefault(); event.stopPropagation(); onCategory(pathCategory.id); return; }
      const originalLabel = control.closest<HTMLElement>('[data-atlas-original-label]')?.dataset.atlasOriginalLabel?.toLowerCase();
      const sourceCategory = categories.find(c => c.label.toLowerCase() === originalLabel || c.id === originalLabel);
      if (sourceCategory) { event.preventDefault(); event.stopPropagation(); onCategory(sourceCategory.id); return; }
      const label = control.textContent?.trim().replace(/^[^A-Za-z]+/, '').trim().toLowerCase() ?? '';
      const category = control.tagName === 'A' ? categories.find(c => label === c.label.toLowerCase() || label.endsWith(` ${c.label.toLowerCase()}`)) : undefined;
      if (category) { event.preventDefault(); event.stopPropagation(); onCategory(category.id); return; }
      if (label === 'explore' || label === 'view all') { event.preventDefault(); onCategory('all'); return; }
      if (screen === 'binary_market' && /^(1h|1d|1w|1m|all)$/i.test(label)) {
        event.preventDefault(); setRange(label === 'all' ? 'max' : label.toLowerCase()); return;
      }
      if (control.id === 'btn-execute-trade') { event.preventDefault(); event.stopPropagation(); }
    };
    doc.addEventListener('click', handler, true);
    return () => doc.removeEventListener('click', handler, true);
  }, [frame, loaded, screen, onCategory, onMarket, onTrending]);

  return { onLoad: () => setLoaded(old => old + 1) };
}
