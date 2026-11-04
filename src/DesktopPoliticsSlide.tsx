import {useCallback,useState} from 'react';
import type {Market} from './marketCatalog';
import {PackedHistory} from './PackedHero';
import politicsStyles from './desktopPoliticsSlide.css?inline';

const pct=(n:number|undefined)=>n===undefined||!Number.isFinite(n)?'—':`${(n*100).toFixed(1)}%`;
const cash=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:1}).format(n||0);

export function DesktopPoliticsSlide({market,connection,onMarket}:{market?:Market;connection:string;onMarket:(id:string)=>void}){
 const [change,setChange]=useState<number|null>(null);
 const onHistory=useCallback((delta:number|null)=>setChange(delta),[]);
 const yes=market?.prices[0],no=market?.prices[1];
 const live=connection==='connected'||connection==='live';
 const ends=market?.endDate?new Date(market.endDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'TBD';
 return <section className="desktop-politics-slide" aria-label="Politics prediction market">
  <style>{politicsStyles}</style><div className="dps-capitol" aria-hidden="true">♜</div>
  <div className="dps-header"><div className="dps-labels"><span className="dps-live"><i/>{live?'LIVE':'UPDATING'}</span><span className="dps-category">POLITICS</span><span className="dps-context">{market?.eventTitle&&market.eventTitle!==market.title?market.eventTitle:'Political prediction intelligence'}</span></div><h2 title={market?.title}>{market?.title||'Connecting to the political market…'}</h2></div>
  <div className="dps-center"><div className="dps-primary">
   <div className="dps-main-chances"><div className="dps-yes"><span>YES · {market?.outcomes[0]||'Probability'}</span><strong>{pct(yes)}</strong></div><div className="dps-no"><span>NO · {market?.outcomes[1]||'Against'}</span><strong>{pct(no)}</strong></div></div>
   <div className="dps-facts"><span>YES price <b>{yes===undefined?'—':`${Math.round(yes*100)}¢`}</b></span><span>NO price <b>{no===undefined?'—':`${Math.round(no*100)}¢`}</b></span><span>24h volume <b>{market?cash(market.volume24h):'—'}</b></span></div>
   <div className="dps-momentum"><span>24H MOMENTUM</span><b className={change!==null&&change>=0?'dps-up':'dps-down'}>{change===null?'Awaiting history':`${change>=0?'+':''}${change.toFixed(1)} pp`}</b></div>
  </div><div className="dps-trend"><div className="dps-chart-head"><span><i className="dps-blue"/> YES {pct(yes)}</span><span><i className="dps-red"/> NO {pct(no)}</span><b>24H HISTORY</b></div><div className="dps-chart"><PackedHistory market={market} onChange={onHistory}/></div></div></div>
  <div className="dps-bottom"><div className="dps-probability"><div style={{width:`${Math.min(100,Math.max(0,(yes||0)*100))}%`}}/><span>YES · {pct(yes)}</span><span>NO · {pct(no)}</span></div><div className="dps-foot-row"><div className="dps-buttons"><button disabled={!market} onClick={()=>market&&onMarket(market.id)}>Buy YES <b>{yes===undefined?'—':`${Math.round(yes*100)}¢`}</b></button><button disabled={!market} onClick={()=>market&&onMarket(market.id)}>Buy NO <b>{no===undefined?'—':`${Math.round(no*100)}¢`}</b></button></div><div className="dps-metadata"><span>◷ Resolves: <b>{ends}</b></span><span>24h Vol: <b>{market?cash(market.volume24h):'—'}</b></span></div></div></div>
 </section>;
}
