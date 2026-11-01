import {ProbabilityDisplay,validProbability} from './ProbabilityDisplay';
import {useQuoteRevision} from './marketQuotes';
import {liveQuotes} from './quoteStore';
import { useEffect, useMemo, useState } from 'react';

type Contract = { title:string; yes:number|null; no:number|null; token?:string; noToken?:string; outcomes?:string[]; prices?:number[]; coins:string[]; volume:number };


export function CryptoHero({marketCount,markets,title='Crypto',symbols=['BTC','ETH','SOL'],description='Twenty tracked assets. Live current probabilities from prediction markets.',account=false}:{marketCount:number;markets:Contract[];title?:string;symbols?:string[];description?:string;account?:boolean}) {
  const snapshots=useMemo(()=>symbols.map(symbol=>({symbol,contract:markets.filter(m=>m.coins.includes(symbol)).sort((a,b)=>b.volume-a.volume)[0]})),[markets,symbols.join()]);
  useQuoteRevision(snapshots.flatMap(item=>[item.contract?.token||'',item.contract?.noToken||'']));
  const featured=snapshots.map(item=>({...item,contract:item.contract?{...item.contract,yes:liveQuotes.get(item.contract.token||'')??item.contract.yes,no:liveQuotes.get(item.contract.noToken||'')??item.contract.no}:undefined}));
  const [selected,setSelected]=useState(symbols[0]||'All');
  useEffect(()=>{if(!symbols.includes(selected))setSelected(symbols[0]||'All');},[symbols.join(),selected]);
  const contract=featured.find(item=>item.symbol===selected)?.contract;
  const availablePrices=[contract?.yes,contract?.no].filter(validProbability);
  const leading=availablePrices.length?Math.max(...availablePrices):null;
  return <section className="cr-live-hero" aria-label={`${title} overview`}>
    <div className="cr-live-hero-copy"><span className="cr-eyebrow">◈ MITMARKET / {title.toUpperCase()} INTELLIGENCE</span><h1>{title} <span>{account?'overview.':'markets.'}</span></h1><p>{description}</p><div className="cr-hero-pills"><span><b>{marketCount}</b> market entries</span><span><b>{title==='Crypto'?20:symbols.length}</b> {title==='Crypto'?'tracked coins':'featured topics'}</span><span><i/> {account?'Account connection required':'Public contract data'}</span></div></div>
    <div className="cr-live-hero-stats"><div className="cr-live-quotes">{featured.map(({symbol,contract:item})=><button type="button" onClick={()=>setSelected(symbol)} className={`cr-live-quote ${selected===symbol?'selected':''}`} key={symbol}><span className={`cr-live-coin-icon cr-live-coin-${symbol.toLowerCase()}`}>{symbol==='BTC'?'₿':symbol==='ETH'?'Ξ':symbol.slice(0,1)}</span><span className="cr-live-quote-number"><b>{symbol} · MARKET</b><strong>{!validProbability(item?.yes)?'Unavailable':`${(item.yes*100).toFixed(1)}¢`}</strong><small>{item?.title||'No verified active contract'}</small></span></button>)}</div><div className="cr-live-prob"><div><small>LEADING CONTRACT PROBABILITY</small><strong>{leading===null?'—':`${(leading*100).toFixed(1)}%`}</strong><span>{contract?.title||'No verified prediction market selected'}</span></div><div className="cr-live-prob-track"><span style={{width:`${leading===null?0:leading*100}%`}}/></div></div><div className="cr-live-status"><span>{account?'ACCOUNT SERVICES':'● PUBLIC PREDICTION DATA'}</span><span>CURRENT PRICES</span></div></div>
    <div className="cr-live-chart"><ProbabilityDisplay featured market={contract?{title:contract.title,outcomes:contract.outcomes??[],prices:(contract.outcomes??[]).map((_,i)=>i===0?contract.yes:i===1?contract.no:contract.prices?.[i])}:undefined}/></div>
  </section>;
}
