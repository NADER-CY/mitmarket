import {useMemo,useState} from 'react';
import type {CSSProperties} from 'react';
import type {Market} from './live';
import breakingCss from './breaking.css?raw';

type Filter='All'|'New'|'Ending soon'|'High volume';
type Sort='latest'|'volume'|'ending';
const filters:Filter[]=['All','New','Ending soon','High volume'];
const day=86_400_000;
const usd=(amount:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:1}).format(amount);
const pct=(value:number)=>Number.isFinite(value)?`${(value*100).toFixed(1)}%`:'—';
const daysAgo=(date:number)=>{if(!date)return 'TIME UNAVAILABLE';const hours=Math.max(0,Math.floor((Date.now()-date)/3_600_000));return hours<1?'JUST LISTED':hours<24?`${hours}H AGO`:`${Math.floor(hours/24)}D AGO`;};
const remaining=(date?:string)=>{const delta=Date.parse(date||'')-Date.now();return Number.isFinite(delta)&&delta>0?delta<day?`${Math.ceil(delta/3_600_000)}h left`:`${Math.ceil(delta/day)}d left`:'OPEN MARKET';};

function MarketCard({market,onMarket,variant='small'}:{market:Market;onMarket:(id:string)=>void;variant?:'lead'|'wide'|'small'}){
  const price=market.prices[0];
  const firstOutcome=market.outcomes[0]||'Yes';
  return <article className={`mit-breaking-card is-${variant}`} tabIndex={0} role="link" aria-label={`Open ${market.title}`} onClick={()=>onMarket(market.id)} onKeyDown={e=>{if(e.key==='Enter')onMarket(market.id);}}>
    <div className="mit-breaking-card-top"><span className="mit-breaking-card-category">{market.category||'MARKET'}</span><span>{daysAgo(market.startTime)}</span></div>
    <div className="mit-breaking-card-title"><span className="mit-breaking-card-image">{market.image?<img src={market.image} loading="lazy" alt="" referrerPolicy="no-referrer"/>:<span>◆</span>}</span><h3>{market.title}</h3></div>
    <div className="mit-breaking-card-main"><div className="mit-breaking-price"><strong>{pct(price)}</strong><span>{firstOutcome} chance</span></div><div className="mit-breaking-gauge" style={{'--chance':`${Number.isFinite(price)?Math.max(0,Math.min(100,price*100)):0}%`} as CSSProperties}><span/></div></div>
    <div className="mit-breaking-outcomes">{market.outcomes.slice(0,2).map((name,i)=><span key={name}>{name}<b>{pct(market.prices[i])}</b></span>)}</div>
    <div className="mit-breaking-card-foot"><span>{usd(market.volume24h)} <small>24H VOL</small></span><span>{remaining(market.endDate)}</span><span className="mit-breaking-arrow">↗</span></div>
  </article>;
}

export function BreakingPage({markets,connection,error,updatedAt,onMarket}:{markets:Market[];connection:string;error:string;updatedAt:number|null;onMarket:(id:string)=>void}){
  const [filter,setFilter]=useState<Filter>('All');
  const [sort,setSort]=useState<Sort>('latest');
  const [query,setQuery]=useState('');
  const [limit,setLimit]=useState(24);
  const fresh=useMemo(()=>{
    const cutoff=Date.now()-7*day;
    return markets.filter(m=>m.startTime>=cutoff&&m.startTime<=Date.now()+60_000&&m.prices.some(Number.isFinite));
  },[markets]);
  const filtered=useMemo(()=>{
    const now=Date.now(),search=query.trim().toLowerCase();
    return fresh.filter(m=>{
      if(search&&!`${m.title} ${m.eventTitle} ${m.category}`.toLowerCase().includes(search))return false;
      if(filter==='New'&&m.startTime<now-day)return false;
      if(filter==='Ending soon'&&(!m.endDate||Date.parse(m.endDate)<now||Date.parse(m.endDate)>now+day))return false;
      if(filter==='High volume'&&m.volume24h<10_000)return false;
      return true;
    }).sort((a,b)=>sort==='volume'?b.volume24h-a.volume24h:sort==='ending'?(Date.parse(a.endDate||'')||Infinity)-(Date.parse(b.endDate||'')||Infinity):b.startTime-a.startTime);
  },[fresh,filter,sort,query]);
  const total24=fresh.reduce((sum,m)=>sum+m.volume24h,0);
  const lead=filtered[0];
  return <div className="mit-breaking" dir="ltr"><style>{breakingCss}</style><div className="mit-breaking-shell">
    <div className="mit-breaking-topline"><span><i/> MITMARKET / BREAKING MARKETS</span><span>{connection==='live'?'● REAL-TIME PRICES':connection==='loading'?'● CONNECTING':'○ FEED RECONNECTING'}</span></div>
    <div className="mit-breaking-heading"><div><span className="mit-breaking-kicker">LATEST PREDICTION MARKET ACTIVITY</span><h1>BREAK<span>ING</span><b>.</b></h1><p>Newly listed prediction markets and fast-moving opportunities, backed by live Polymarket prices.</p></div><div className="mit-breaking-stats"><div><small>RECENT MARKETS</small><strong>{fresh.length.toLocaleString()}</strong></div><div><small>24H VOLUME</small><strong>{usd(total24)}</strong></div><div><small>UPDATED</small><strong>{updatedAt?new Date(updatedAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):'—'}</strong></div></div></div>
    <div className="mit-breaking-tape"><span className="mit-breaking-tape-label"><i/> BREAKING WATCH</span><div>{fresh.slice(0,9).map(m=><button key={m.id} onClick={()=>onMarket(m.id)}>{m.title}<b>{pct(m.prices[0])}</b></button>)}</div></div>
    <div className="mit-breaking-controls"><div className="mit-breaking-pills">{filters.map(item=><button key={item} className={item===filter?'selected':''} onClick={()=>{setFilter(item);setLimit(24);}}>{item}</button>)}</div><div className="mit-breaking-inputs"><input value={query} onChange={e=>{setQuery(e.target.value);setLimit(24);}} placeholder="Search breaking markets" aria-label="Search markets"/><select value={sort} onChange={e=>setSort(e.target.value as Sort)} aria-label="Sort markets"><option value="latest">Newest first</option><option value="volume">24h volume</option><option value="ending">Ending soon</option></select></div></div>
    {lead?<><div className="mit-breaking-section-title"><h2>Latest markets</h2><span>{filtered.length} CURRENT MATCHES</span></div><div className="mit-breaking-grid">{filtered.slice(0,limit).map((m,i)=><MarketCard key={m.id} market={m} onMarket={onMarket} variant={i===0?'lead':i%7===4?'wide':'small'}/>)}</div>{limit<filtered.length&&<button className="mit-breaking-more" onClick={()=>setLimit(n=>n+24)}>Load more verified markets ↓</button>}</>:<div className="mit-breaking-empty">{connection==='loading'?'Loading recent market listings…':error?`Feed temporarily unavailable: ${error}`:'No markets match this time window and filter.'}</div>}
    <footer className="mit-breaking-disclaimer">Breaking refers to recently listed prediction markets, not independently verified breaking news. Percentages are Polymarket market prices; no fabricated stories or trades.</footer>
  </div></div>;
}
