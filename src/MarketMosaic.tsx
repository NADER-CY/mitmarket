import {useMemo, useState, useLayoutEffect, useEffect, useRef, createContext, useContext, type ReactNode} from 'react';
import type {Market} from './live';
import {useQuotedMarkets} from './marketQuotes';
import {ProbabilityDisplay, probabilityText, validProbability} from './ProbabilityDisplay';
import css from './marketMosaic.css?raw';
import {formatReferenceMoney} from './fx';
import type {Currency} from './PreferencesDialog';

export const MosaicCurrency=createContext<{currency:Currency;fxRate:number|null;language:string}>({currency:'USD',fxRate:1,language:'en'});

function MosaicStyles(){
  const ref=useRef<HTMLSpanElement>(null);
  useLayoutEffect(()=>{const doc=ref.current?.ownerDocument;if(!doc||doc.getElementById('mm-layout-style'))return;const style=doc.createElement('style');style.id='mm-layout-style';style.textContent=css;doc.body.appendChild(style);},[]);
  return <span ref={ref} hidden/>;
}

export type DiscoveryMarket = Pick<Market,'id'|'title'|'outcomes'|'prices'> & Partial<Pick<Market,'eventId'|'eventTitle'|'category'|'image'|'volume24h'|'endDate'>>;
export type OpenTrade = (id:string, outcome?:number)=>void;
const quote = (p:unknown)=>validProbability(p)?`${(p*100).toFixed(1).replace(/\.0$/,'')}¢`:'Unavailable';

export function TradeButtons({market,onMarket,onlyOutcome}:{market:DiscoveryMarket;onMarket:OpenTrade;onlyOutcome?:number}){
  const indices=onlyOutcome===undefined?market.outcomes.map((_,i)=>i):[onlyOutcome];
  return <div className="mm-trades">{indices.map(i=><button type="button" className={`mm-trade ${i%2?'mm-no':'mm-yes'}`} key={i} disabled={!validProbability(market.prices[i])} onClick={()=>onMarket(market.id,i)} aria-label={`Trade ${market.outcomes[i]} on ${market.title} at ${quote(market.prices[i])}`}><span>{market.outcomes[i]}</span><strong>{quote(market.prices[i])}</strong></button>)}</div>;
}

function Meta({market}:{market:DiscoveryMarket}){const {currency,fxRate,language}=useContext(MosaicCurrency);return <footer className="mm-meta"><span>{Number.isFinite(market.volume24h)?`${formatReferenceMoney(market.volume24h!,currency,fxRate,language)} 24h volume`:'Volume unavailable'}</span>{market.endDate&&<time dateTime={market.endDate}>{new Date(market.endDate).toLocaleDateString(language,{month:'short',day:'numeric'})}</time>}</footer>;}
function Identity({market}:{market:DiscoveryMarket}){return <div className="mm-identity">{market.image&&<img src={market.image} alt="" loading="lazy" referrerPolicy="no-referrer"/>}<span>{market.category||'Market'}</span></div>;}

export function MarketTile({market,onMarket,featured=false,action}:{market:DiscoveryMarket;onMarket:OpenTrade;featured?:boolean;action?:ReactNode}){
  const [selected,setSelected]=useState(0);
  const outcome=Math.min(selected,Math.max(0,market.outcomes.length-1));
  const multi=market.outcomes.length>2;
  return <article className={`mm-card ${featured?'mm-featured':multi?'mm-multi':'mm-binary'}`} data-layout={featured?'featured':multi?'outcomes':'binary'}>
    <MosaicStyles/>{action}<div className="mm-copy"><Identity market={market}/><h3><button className="mm-question" onClick={()=>onMarket(market.id)}>{market.title}</button></h3>
      {multi&&<div className="mm-outcome-list" role="group" aria-label={`Choose outcome for ${market.title}`}>{market.outcomes.map((name,i)=><button type="button" className={`mm-option ${outcome===i?'selected':''}`} aria-pressed={outcome===i} key={i} onClick={()=>setSelected(i)}><span>{name}</span><strong>{probabilityText(market.prices[i])}</strong><i className="mm-track" aria-hidden="true">{validProbability(market.prices[i])&&<i style={{width:`${market.prices[i]*100}%`}}/>}</i></button>)}</div>}
      {multi&&<p className="mm-selected">Selected outcome: <strong>{market.outcomes[outcome]}</strong></p>}
      {!featured&&<TradeButtons market={market} onMarket={onMarket} onlyOutcome={multi?outcome:undefined}/>}
      {!market.outcomes.length&&<p className="mm-unavailable">Outcome prices unavailable</p>}
      <Meta market={market}/>
    </div>
    {featured&&<><ProbabilityDisplay market={market} featured/><TradeButtons market={market} onMarket={onMarket} onlyOutcome={multi?outcome:undefined}/></>}
  </article>;
}

export function ContractListCard({markets,onMarket,action,onReveal}:{markets:DiscoveryMarket[];onMarket:OpenTrade;action?:ReactNode;onReveal?:(ids:string[])=>void}){
  const [selectedId,setSelectedId]=useState(markets[0]?.id);
  const [visible,setVisible]=useState(4);
  const visibleKey=markets.slice(0,visible).map(m=>m.id).join(',');
  useEffect(()=>{if(visible>4)onReveal?.(visibleKey.split(','));},[visibleKey,visible,onReveal]);
  const selected=markets.find(m=>m.id===selectedId)??markets[0];
  if(!selected)return null;
  return <article className="mm-card mm-contracts" data-layout="contracts"><MosaicStyles/>{action}<Identity market={selected}/><h3>{selected.eventTitle||selected.title}</h3><p className="mm-note">Independent contracts · select a question to trade</p>
    <div className="mm-outcome-list">{markets.slice(0,visible).map(m=><button type="button" className={`mm-option ${m.id===selected.id?'selected':''}`} key={m.id} aria-pressed={m.id===selected.id} onClick={()=>setSelectedId(m.id)}><span>{m.title}</span><strong>{m.outcomes[0]||'Outcome'} {probabilityText(m.prices[0])}</strong><i className="mm-track" aria-hidden="true">{validProbability(m.prices[0])&&<i style={{width:`${m.prices[0]*100}%`}}/>}</i></button>)}</div>
    {visible<markets.length&&<button className="mm-more-options" onClick={()=>setVisible(n=>n+4)}>Show more contracts ({markets.length-visible})</button>}
    <p className="mm-selected">Selected contract: <strong>{selected.title}</strong></p><TradeButtons market={selected} onMarket={onMarket}/><Meta market={selected}/>
  </article>;
}

export function MatchCentreCard({markets,onMarket,action}:{markets:DiscoveryMarket[];onMarket:OpenTrade;action?:ReactNode}){
  return <article className="mm-card mm-matches" data-layout="matches"><MosaicStyles/>{action}<div className="mm-section-kicker">SPORTS / MATCH CENTRE</div><h3>Matches to watch</h3><div className="mm-match-list">{markets.map(m=><section className="mm-match" key={m.id}><Identity market={m}/><h4><button className="mm-question" onClick={()=>onMarket(m.id)}>{m.title}</button></h4><TradeButtons market={m} onMarket={onMarket}/></section>)}</div></article>;
}

function QuotedTile({group,onMarket,kind,saved,onSave,onReveal}:{group:Market[];onMarket:OpenTrade;kind:'matches'|'contracts'|'featured'|'binary';saved?:Set<string>;onSave?:(id:string)=>void;onReveal?:(ids:string[])=>void}){
  const quoted=useQuotedMarkets(group);
  const action=onSave?<button className="mm-bookmark" aria-label={`Bookmark ${group[0].title}`} aria-pressed={saved?.has(group[0].id)??false} onClick={()=>onSave(group[0].id)}>{saved?.has(group[0].id)?'★':'☆'}</button>:undefined;
  return kind==='matches'?<MatchCentreCard action={action} markets={quoted} onMarket={onMarket}/>:kind==='contracts'?<ContractListCard onReveal={onReveal} action={action} markets={quoted} onMarket={onMarket}/>:<MarketTile action={action} market={quoted[0]} onMarket={onMarket} featured={kind==='featured'}/>;
}

export function MarketMosaic({markets,onMarket,saved,onSave,onReveal}:{markets:Market[];onMarket:OpenTrade;saved?:Set<string>;onSave?:(id:string)=>void;onReveal?:(ids:string[])=>void}){
  const tiles=useMemo(()=>{
    const groups=new Map<string,Market[]>();
    for(const market of markets){const key=market.eventId||market.id;const group=groups.get(key)??[];group.push(market);groups.set(key,group);}
    const result:{group:Market[];kind:'matches'|'contracts'|'featured'|'binary'}[]=[];
    const sports:Market[]=[];
    for(const group of groups.values()){
      if(/sports|esports/i.test(group[0].category||'')){sports.push(group[0]);if(group.length>1)result.push({group,kind:'contracts'});continue;}
      result.push({group,kind:group.length>1?'contracts':result.length%5===3?'featured':'binary'});
    }
    for(let i=0;i<sports.length;i+=3)result.splice(Math.min(i,result.length),0,{group:sports.slice(i,i+3),kind:'matches'});
    if(sports.length>1)result.push({group:[sports[0]],kind:'featured'});
    return result;
  },[markets]);
  return <div className="mm-mosaic"><MosaicStyles/>{tiles.map(({group,kind})=><QuotedTile key={`${kind}:${group[0].id}`} group={group} kind={kind} onMarket={onMarket} saved={saved} onSave={onSave} onReveal={onReveal}/>)}</div>;
}
