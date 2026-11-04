import {useCallback,useState} from 'react';
import type {Market} from './marketCatalog';
import {PackedHistory} from './PackedHero';
import sportsSlideStyles from './desktopSportsSlide.css?inline';

const percent=(value:number|undefined)=>value===undefined||!Number.isFinite(value)?'—':`${(value*100).toFixed(1)}%`;
const amount=(value:number)=>Number.isFinite(value)?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:1}).format(value):'—';

export function DesktopSportsSlide({market,connection,onMarket}:{market?:Market;connection:string;onMarket:(id:string)=>void}){
 const [delta,setDelta]=useState<number|null>(null);
 const update=useCallback((change:number|null)=>setDelta(change),[]);
 const first=market?.outcomes[0]||'Outcome A',second=market?.outcomes[1]||'Outcome B';
 const yes=market?.prices[0],no=market?.prices[1];
 const live=connection==='connected'||connection==='live';
 const date=market?.endDate?new Date(market.endDate).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'Open market';
 return <section className="desktop-sports-slide" aria-label="Sports prediction market">
  <style>{sportsSlideStyles}</style>
  <div className="dss-ambient" aria-hidden="true"/>
  <div className="dss-columns">
   <div className="dss-left">
    <div className="dss-head">
     <div className="dss-meta"><span className="dss-live"><i/>{live?'LIVE':'UPDATING'}</span><span>SPORTS · PUBLIC MARKET FEED</span></div>
     <h2 title={market?.title}>{market?.title||'Connecting to the sports market…'}</h2>
     <p>{market?.eventTitle&&market.eventTitle!==market.title?market.eventTitle:'Live prediction probabilities'}</p>
    </div>
    <div className="dss-probability-card">
     <div className="dss-probability-grid">
      <div><div className="dss-team"><span className="dss-team-icon">A</span><strong title={first}>{first}</strong></div><div className="dss-price dss-first">{percent(yes)} <small>PROB</small></div></div>
      <div><div className="dss-team"><span className="dss-team-icon dss-icon-second">B</span><strong title={second}>{second}</strong></div><div className="dss-price dss-second">{percent(no)} <small>PROB</small></div></div>
     </div>
     <div className="dss-split" aria-label="Market probability split"><span style={{width:`${Math.min(100,Math.max(0,(yes||0)*100))}%`}}/><span style={{width:`${Math.min(100,Math.max(0,(no||0)*100))}%`}}/></div>
    </div>
    <div className="dss-actions"><button disabled={!market} onClick={()=>market&&onMarket(market.id)}><strong>{first}</strong><span>{yes===undefined?'Market details':`Yes · ${Math.round(yes*100)}¢`}</span></button><button disabled={!market} onClick={()=>market&&onMarket(market.id)}><strong>{second}</strong><span>{no===undefined?'Market details':`Yes · ${Math.round(no*100)}¢`}</span></button></div>
    <div className="dss-info"><span>◷ {date}</span><span>24h Vol: <strong>{market?amount(market.volume24h):'—'}</strong></span></div>
   </div>
   <div className="dss-right">
    <div className="dss-chart-head"><div className="dss-legend"><span><i className="dss-dot-blue"/><strong title={first}>{first}</strong><b>{percent(yes)}</b></span><span><i className="dss-dot-red"/><strong title={second}>{second}</strong><b>{percent(no)}</b></span></div><span className="dss-timeframe">24H</span></div>
    <div className="dss-chart"><PackedHistory market={market} onChange={update}/></div>
    <div className="dss-chart-footer"><span>24H PROBABILITY HISTORY</span><span className={delta!==null&&delta>=0?'dss-positive':'dss-negative'}>{delta===null?'Awaiting history':`${delta>=0?'+':''}${delta.toFixed(1)} pp · 24h`}</span></div>
   </div>
  </div>
 </section>;
}
