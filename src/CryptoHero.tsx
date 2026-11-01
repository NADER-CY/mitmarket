import {useDesktopRuntime} from './DesktopRuntime';
import {useDesktopPriceHistory} from './useDesktopPriceHistory';
import {useQuoteRevision} from './marketQuotes';
import {liveQuotes} from './quoteStore';
import { useEffect, useMemo, useState } from 'react';

type Contract = { title:string; yes:number|null; no:number|null; token?:string; noToken?:string; coins:string[]; volume:number };
type HistoryPoint = { t:number; p:number };

export function CryptoHero({marketCount,markets,title='Crypto',symbols=['BTC','ETH','SOL'],description='Twenty tracked assets. Live prediction-market probabilities and verified historical trends.',account=false}:{marketCount:number;markets:Contract[];title?:string;symbols?:string[];description?:string;account?:boolean}) {
  const desktop=useDesktopRuntime();
  const snapshots=useMemo(()=>symbols.map(symbol=>({symbol,contract:markets.filter(m=>m.coins.includes(symbol)&&m.yes!==null&&m.no!==null).sort((a,b)=>b.volume-a.volume)[0]})),[markets,symbols.join()]);
  useQuoteRevision(snapshots.flatMap(item=>[item.contract?.token||'',item.contract?.noToken||'']));
  const featured=snapshots.map(item=>({...item,contract:item.contract?{...item.contract,yes:liveQuotes.get(item.contract.token||'')??item.contract.yes,no:liveQuotes.get(item.contract.noToken||'')??item.contract.no}:undefined}));
  const [selected,setSelected]=useState(symbols[0]||'All');
  useEffect(()=>{if(!symbols.includes(selected))setSelected(symbols[0]||'All');},[symbols.join(),selected]);
  const [period,setPeriod]=useState('1D');
  const [legacyPoints,setPoints]=useState<HistoryPoint[]>([]);
  const [legacyState,setHistoryState]=useState<'loading'|'ready'|'unavailable'>('loading');
  const [hover,setHover]=useState<number|null>(null);
  const contract=featured.find(item=>item.symbol===selected)?.contract;
  const intervals:Record<string,string>={'1H':'1h','1D':'1d','1W':'1w','1M':'1m'};
  const historyUrl=desktop&&contract?.token?`https://clob.polymarket.com/prices-history?market=${encodeURIComponent(contract.token)}&interval=${intervals[period]}&fidelity=5`:'';
  const desktopHistory=useDesktopPriceHistory(historyUrl,desktop?60000:0);
  const points=desktop?desktopHistory.points:legacyPoints;
  const historyState=desktop?(points.length>=2?'ready':desktopHistory.status==='loading'?'loading':'unavailable'):legacyState;
  useEffect(()=>{if(desktop)return;let active=true;const controller=new AbortController();setPoints([]);setHistoryState('loading');if(!contract?.token){setHistoryState('unavailable');return()=>controller.abort();}
    const intervals:Record<string,string>={'1H':'1h','1D':'1d','1W':'1w','1M':'1m'};
    const load=async()=>{try{const url=new URL('https://clob.polymarket.com/prices-history');url.searchParams.set('market',contract.token!);url.searchParams.set('interval',intervals[period]);url.searchParams.set('fidelity','5');const response=await fetch(url.toString(),{signal:controller.signal});if(!response.ok)throw Error('History unavailable');const data=await response.json() as {history?:HistoryPoint[]};if(!active)return;const next=(data.history||[]).filter(p=>Number.isFinite(p.t)&&Number.isFinite(p.p)&&p.p>=0&&p.p<=1).sort((a,b)=>a.t-b.t);setPoints(next);setHistoryState(next.length>=2?'ready':'unavailable');}catch{if(active)setHistoryState('unavailable');}};
    void load();const timer=window.setInterval(load,60000);return()=>{active=false;controller.abort();window.clearInterval(timer);};},[contract?.token,period,desktop]);
  const leading=contract?.yes!==null&&contract?.yes!==undefined&&contract.no!==null&&contract.no!==undefined?Math.max(contract.yes,contract.no):null;
  const low=points.length?Math.max(0,Math.min(...points.map(p=>p.p))-.04):0;
  const high=points.length?Math.min(1,Math.max(...points.map(p=>p.p))+.04):1;
  const span=Math.max(.01,high-low);
  const first=points[0]?.t||0,last=points.at(-1)?.t||0;
  const x=(p:HistoryPoint)=>16+(p.t-first)/Math.max(1,last-first)*492;
  const y=(p:HistoryPoint)=>194-(p.p-low)/span*174;
  const line=points.map(p=>`${x(p)},${y(p)}`).join(' ');
  const area=points.length?`16,204 ${line} 508,204`:'';
  const hovered=hover===null?null:points[Math.round(hover*(points.length-1))];
  return <section className="cr-live-hero" aria-label={`${title} overview`}>
    <div className="cr-live-hero-copy"><span className="cr-eyebrow">◈ MITMARKET / {title.toUpperCase()} INTELLIGENCE</span><h1>{title} <span>{account?'overview.':'markets.'}</span></h1><p>{description}</p><div className="cr-hero-pills"><span><b>{marketCount}</b> market entries</span><span><b>{title==='Crypto'?20:symbols.length}</b> {title==='Crypto'?'tracked coins':'featured topics'}</span><span><i/> {account?'Account connection required':'Public contract data'}</span></div></div>
    <div className="cr-live-hero-stats"><div className="cr-live-quotes">{featured.map(({symbol,contract:item})=><button type="button" onClick={()=>setSelected(symbol)} className={`cr-live-quote ${selected===symbol?'selected':''}`} key={symbol}><span className={`cr-live-coin-icon cr-live-coin-${symbol.toLowerCase()}`}>{symbol==='BTC'?'₿':symbol==='ETH'?'Ξ':symbol.slice(0,1)}</span><span className="cr-live-quote-number"><b>{symbol} · MARKET</b><strong>{item?.yes===null||item?.yes===undefined?'—':`${(item.yes*100).toFixed(1)}¢`}</strong><small>{item?.title||'No verified active contract'}</small></span></button>)}</div><div className="cr-live-prob"><div><small>LEADING CONTRACT PROBABILITY</small><strong>{leading===null?'—':`${(leading*100).toFixed(1)}%`}</strong><span>{contract?.title||'No verified prediction market selected'}</span></div><div className="cr-live-prob-track"><span style={{width:`${leading===null?0:leading*100}%`}}/></div></div><div className="cr-live-status"><span>{account?'ACCOUNT SERVICES':'● PUBLIC PREDICTION DATA'}</span><span>{historyState==='ready'?'VERIFIED PRICE HISTORY':historyState==='loading'?'CONNECTING TO HISTORY':'HISTORY UNAVAILABLE'}</span></div></div>
    <div className="cr-live-chart"><div className="cr-live-chart-head"><span>{selected} · CONTRACT PROBABILITY</span><strong>{contract?.yes===null||contract?.yes===undefined?'—':`${(contract.yes*100).toFixed(1)}¢`}</strong></div>{historyState==='ready'?<div style={desktop?{position:'relative',display:'flex',flex:1,minHeight:195}: {display:'contents'}}><svg viewBox="0 0 560 228" preserveAspectRatio="none" role="img" aria-label={`Verified ${selected} contract price history in ${period}`} onMouseMove={event=>{const box=event.currentTarget.getBoundingClientRect();setHover(Math.min(1,Math.max(0,(event.clientX-box.left)/box.width)));}} onMouseLeave={()=>setHover(null)}><defs><linearGradient id="crHeroFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#1463ff" stopOpacity=".32"/><stop offset="1" stopColor="#1463ff" stopOpacity="0"/></linearGradient></defs>{[0,1,2,3,4].map(i=><g key={i}><line x1="15" x2="512" y1={18+i*44} y2={18+i*44} stroke="#30435c" strokeDasharray="3 6"/>{!desktop&&<text x="520" y={21+i*44} fill="#9baec7" fontSize="11">{((high-i*span/4)*100).toFixed(0)}%</text>}</g>)}<polygon points={area} fill="url(#crHeroFill)"/><polyline points={line} fill="none" stroke="#1463ff" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="round"/>{hovered&&<><circle cx={x(hovered)} cy={y(hovered)} r="5" fill="#0bba74" stroke="#fff" strokeWidth="1.5"/><line x1={x(hovered)} x2={x(hovered)} y1="12" y2="204" stroke="#6d9fff" strokeDasharray="3 5"/><text x="18" y="218" fontSize="11" fill="#f2f6ff">{new Date(hovered.t*1000).toLocaleString('en-US')} · {(hovered.p*100).toFixed(1)}¢</text></>}</svg>{desktop&&<div style={{position:'absolute',inset:0,pointerEvents:'none'}}>{[0,1,2,3,4].map(i=><span key={i} style={{position:'absolute',left:'92.85%',top:`${(18+i*44)/228*100}%`,transform:'translateY(-50%)',color:'#9baec7',font:'500 11px/1 Inter,Arial,sans-serif'}}>{((high-i*span/4)*100).toFixed(0)}%</span>)}</div>}</div>:<div className="cr-live-chart-empty">{historyState==='loading'?'Loading actual contract-price history…':'Historical data unavailable for this contract'}</div>}<div className="cr-live-periods">{['1H','1D','1W','1M'].map(p=><button key={p} className={period===p?'active':''} onClick={()=>setPeriod(p)}>{p}</button>)}</div></div>
  </section>;
}
