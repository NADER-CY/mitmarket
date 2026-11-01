import {homeCategoryLimit,homeCategoryLayout,type HomeCardVariant} from './homeCategoryLayout';
import {CategorySymbol,categoryDestination} from './CategorySymbol';
import {appendStableOrder} from './stableTrendingCards';
import {useDesktopPriceHistory} from './useDesktopPriceHistory';
import {useQuotedMarkets} from './marketQuotes';
import {useNearViewport} from './useNearViewport';
import { useCallback,memo,useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Market } from './live';
import type { Language } from './i18n';
import type { Currency } from './PreferencesDialog';
import { formatReferenceMoney } from './fx';
import trendingCss from './trending.css?raw';

type MarketFilter = 'All markets' | 'Politics' | 'Sports' | 'Crypto' | 'Finance' | 'Geopolitics' | 'Technology' | 'Elections' | 'Economy' | 'Culture';
type MarketSort = 'volume'|'total'|'liquidity'|'newest'|'ending'|'competitive';
const sortItems:{value:MarketSort;label:string;icon:string}[]=[
  {value:'volume',label:'24hr Volume',icon:'↗'}, {value:'total',label:'Total Volume',icon:'♧'},
  {value:'liquidity',label:'Liquidity',icon:'♧'}, {value:'newest',label:'Newest',icon:'✧'},
  {value:'ending',label:'Ending Soon',icon:'◷'}, {value:'competitive',label:'Competitive',icon:'◎'},
];
type TimeWindow='all'|'daily'|'weekly'|'monthly';
const endingItems:{value:TimeWindow;label:string}[]=[{value:'all',label:'All'},{value:'daily',label:'Within 24h'},{value:'weekly',label:'Within 7 days'},{value:'monthly',label:'Within 30 days'}];
const topicAliases:[RegExp,string][]=[
  [/college football|\bCFB\b/i,'CFB'],[/midterm|balance of power/i,'Midterms'],[/brazil|rio de janeiro|são paulo|sao paulo/i,'Brazil'],
  [/serbia.*election/i,'Serbia Elections'],[/bulgaria.*election/i,'Bulgaria Election'],[/worlds 2026|lol worlds/i,'LoL Worlds 2026'],
  [/israel.*election/i,'Israel Election'],[/world series|mlb playoff/i,'MLB Playoffs'],[/france.*riot/i,'France Riots'],
  [/\bfable\b/i,'Fable'],[/iran/i,'Iran'],[/ballon d.or/i,"Ballon d'Or"],[/grand theft auto|gta 6|gta vi/i,'GTA VI'],
  [/fed rate|federal reserve|fomc/i,'Fed'],[/astra/i,'Astra'],[/ilhan omar/i,'Ilhan Omar'],[/derivative/i,'Derivatives'],
  [/yemen/i,'Yemen'],[/artificial intelligence|\bAI\b|openai/i,'AI'],[/trump/i,'Trump'],[/spain.*election/i,'Spain Elections'],
  [/cockroach party/i,'Cockroach Party'],
];
const requestedTopics=['All',...topicAliases.map(([,label])=>label)];
const prizeSlides=[
  {rank:'01',name:'Lamborghini Revuelto',amount:'≈ $673,000',detail:'2026 flagship supercar · estimated vehicle value',tone:'car'},
  {rank:'02',name:'1 KG GOLD BAR',amount:'≈ $129,000',detail:'One kilogram 24K investment gold · indicative spot value',tone:'gold'},
  {rank:'03',name:'25,000 USDT',amount:'$25,000',detail:'Proposed crypto reward · paid in Tether',tone:'usdt'},
  {rank:'04—10',name:'TOP 10 TRADERS',amount:'$3,850',detail:'Combined proposed USDT rewards for places 4–10',tone:'ranks'},
] as const;
const runnerUpPrizes=[1000,850,700,550,400,250,100];
const EMPTY_MARKETS:Market[]=[];
type PricePoint = {t:number;p:number};

function useFeaturedHistory(token?:string){
 return useDesktopPriceHistory(token?`https://clob.polymarket.com/prices-history?market=${encodeURIComponent(token)}&interval=1m&fidelity=240`:'');
}

function ProbabilityLine({market,connection,comparisonMarket}:{market:Market;connection:string;comparisonMarket?:Market}) {
  const [chartRef,near]=useNearViewport();
  const [activated,setActivated]=useState(false);
  useEffect(()=>{if(near)setActivated(true);},[near]);
  const mainIndex=comparisonMarket?0:(Number(market.prices[1])>Number(market.prices[0])?1:0);
  const otherMarket=comparisonMarket??market;
  const otherIndex=comparisonMarket?0:1-mainIndex;
  const mainHistory=useFeaturedHistory(activated?market.tokenIds[mainIndex]:undefined);
  const otherHistory=useFeaturedHistory(activated?otherMarket.tokenIds[otherIndex]:undefined);
  const points=mainHistory.points,comparison=otherHistory.points;
  const historyLoading=mainHistory.status==='loading'||otherHistory.status==='loading';
  const [hoverRatio,setHoverRatio]=useState<number|null>(null);
  const primaryPrice=market.prices[mainIndex];
  const secondaryPrice=otherMarket.prices[otherIndex];
  const primaryLabel=comparisonMarket?market.title:(market.outcomes[mainIndex]||'Yes');
  const secondaryLabel=comparisonMarket?comparisonMarket.title:(market.outcomes[otherIndex]||'No');
  const plot=useMemo(()=>{
    const now=Math.floor(Date.now()/1000);
    const augment=(history:PricePoint[],price:number)=>history.length>=2&&Number.isFinite(price)?[...history,{t:Math.max(now,history[history.length-1].t+1),p:price}]:history;
    const first=augment(points,primaryPrice),second=augment(comparison,secondaryPrice);
    if(first.length<2&&second.length<2)return null;
    const available=[...first,...second];const start=Math.min(...available.map(p=>p.t)),end=Math.max(...available.map(p=>p.t));const range=Math.max(1,end-start);
    const x=(t:number)=>18+(t-start)/range*574;
    const y=(p:number)=>232-Math.max(0,Math.min(1,p))*208;
    const shape=(series:PricePoint[])=>series.map((p,i)=>`${i?'L':'M'}${x(p.t).toFixed(2)},${y(p.p).toFixed(2)}`).join(' ');
    const nearest=(series:PricePoint[],t:number)=>series.reduce<PricePoint|undefined>((best,p)=>!best||Math.abs(p.t-t)<Math.abs(best.t-t)?p:best,undefined);
    return {first,second,start,range,x,y,shape,nearest};
  },[points,comparison,primaryPrice,secondaryPrice]);
  const hovered=plot&&hoverRatio!==null?(()=>{const t=plot.start+plot.range*hoverRatio;return {t,first:plot.nearest(plot.first,t),second:plot.nearest(plot.second,t)};})():null;
  return <div ref={chartRef} className="trending-feature-graph trending-interactive-graph">
    <div className="trending-graph-top"><span>HISTORICAL ODDS + LIVE MARKET PRICE</span><span className="trending-live-dot">● {connection==='live'?'WS CONNECTED':'HISTORY'}</span></div>
    <div className="trending-graph-legend"><span><i style={{background:'#1463ff'}}/>{primaryLabel} <b>{precisePercent(primaryPrice)}</b></span><span><i style={{background:'#ff4761'}}/>{secondaryLabel} <b>{precisePercent(secondaryPrice)}</b></span></div>
    {plot?<div className="trending-graph-interaction">
      <svg viewBox="0 0 650 264" preserveAspectRatio="none" role="img" aria-label={`${market.title}: historical odds and latest live outcome probabilities`} onMouseMove={event=>{const r=event.currentTarget.getBoundingClientRect();setHoverRatio(Math.max(0,Math.min(1,((event.clientX-r.left)/r.width*650-18)/574)));}} onMouseLeave={()=>setHoverRatio(null)}>
        {[0,.25,.5,.75,1].map(level=><g key={level}><line x1="18" x2="592" y1={plot.y(level)} y2={plot.y(level)} stroke="#29313D" strokeDasharray="4 7"/></g>)}
        {plot.first.length>=2&&<path d={plot.shape(plot.first)} stroke="#1463ff" strokeWidth="2.8" strokeLinejoin="round" fill="none" vectorEffect="non-scaling-stroke"/>}
        {plot.second.length>=2&&<path d={plot.shape(plot.second)} stroke="#ff4761" strokeWidth="2.4" strokeLinejoin="round" fill="none" vectorEffect="non-scaling-stroke"/>}
        {plot.first.length>=2&&<circle cx={plot.x(plot.first[plot.first.length-1].t)} cy={plot.y(plot.first[plot.first.length-1].p)} r="4" fill="#1463ff"/>}
        {plot.second.length>=2&&<circle cx={plot.x(plot.second[plot.second.length-1].t)} cy={plot.y(plot.second[plot.second.length-1].p)} r="3.5" fill="#ff4761"/>}
        {hovered&&<line x1={plot.x(hovered.t)} x2={plot.x(hovered.t)} y1="24" y2="232" stroke="#CBD3DF" strokeDasharray="4 5" strokeOpacity=".7"/>}
      </svg>
      <div className="trending-axis-labels" aria-hidden="true">{[0,.25,.5,.75,1].map(level=><span key={level} style={{top:`${plot.y(level)/264*100}%`}}>{Math.round(level*100)}%</span>)}</div>
      {hovered&&<div className="trending-graph-tooltip" style={{left:`${Math.max(16,Math.min(68,hoverRatio!*75))}%`}}><strong>{new Date(hovered.t*1000).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</strong><span><i style={{background:'#1463ff'}}/>{primaryLabel}: <b>{precisePercent(hovered.first?.p)}</b></span><span><i style={{background:'#ff4761'}}/>{secondaryLabel}: <b>{precisePercent(hovered.second?.p)}</b></span><small>24h volume: {Math.round(market.volume24h).toLocaleString('en-US')} USDC</small></div>}
    </div>:<div className="trending-graph-empty">{!activated||historyLoading?'Loading real market history…':mainHistory.status==='error'||otherHistory.status==='error'?'History temporarily unavailable.':'No historical data available for this market.'}{activated&&!historyLoading&&<button className="trending-history-retry" onClick={()=>{mainHistory.retry();otherHistory.retry();}}>Retry history</button>}</div>}
  </div>;
}

function CoinIcon({market}:{market:Market}) {return market.image?<img src={market.image} alt="" loading="lazy" referrerPolicy="no-referrer"/>:<span className="trending-icon-fallback">◆</span>;}
function precisePercent(value:number|undefined) {return Number.isFinite(value)?`${(Number(value)*100).toFixed(1)}%`:'—';}
function marketKind(m:Market):'crypto'|'sports'|'standard' {const title=`${m.title} ${m.eventTitle}`.toLowerCase();return /\b(btc|bitcoin|eth|ethereum|sol|solana)\b/.test(title)&&/\b(up|down|above|below|5m|15m)\b/.test(title)?'crypto':/\b(vs\.?|versus|game|match|fc |united|esports|nba|nfl|cs2)\b/.test(title)?'sports':'standard';}
function StreamValue({price}:{price:number|undefined}) {
  const previous=useRef(price);
  const [movement,setMovement]=useState<'up'|'down'|''>('');
  useEffect(()=>{if(!Number.isFinite(price)||!Number.isFinite(previous.current)){previous.current=price;return;}
    if(price!==previous.current){setMovement(Number(price)>Number(previous.current)?'up':'down');previous.current=price;const timer=window.setTimeout(()=>setMovement(''),1100);return()=>window.clearTimeout(timer);}
  },[price]);
  return <strong className={`trending-stream-value ${movement}`}>{precisePercent(price)}</strong>;
}
function OddsGauge({value,label='chance',compact=false}:{value:number|undefined;label?:string;compact?:boolean}){
  if(!Number.isFinite(value))return <span className="trending-gauge-unavailable">—</span>;
  const price=Number(value);
  const tone=price>=.65?'#0bba74':price>=.35?'#F59E42':'#ff4761';
  const style={'--odds':`${Math.max(0,Math.min(100,price*100))}%`,'--gauge-color':tone} as CSSProperties;
  return <span className={`trending-odds-gauge ${compact?'trending-odds-gauge-compact':''}`} role="img" aria-label={`${precisePercent(price)} ${label}`} style={style}><strong>{Math.round(price*100)}%</strong>{!compact&&<small>{label}</small>}</span>;
}
function groupEvents(markets: Market[]) {
  const groups = new Map<string,Market[]>();
  for(const market of markets){const key=market.eventTitle||market.id;const group=groups.get(key);if(group)group.push(market);else groups.set(key,[market]);}
  return [...groups.values()].map(group=>group.length>1?[...group].sort((a,b)=>(b.prices[0]??0)-(a.prices[0]??0)):group);
}

type BentoVariant = HomeCardVariant;

function CardProbabilityBar({market}:{market:Market}) {
  const [yes,no]=market.prices;
  if(market.outcomes.length!==2||!Number.isFinite(yes)||!Number.isFinite(no)||yes+no<=0)return null;
  return <div className="trending-card-share" role="img" aria-label={`${market.outcomes[0]} ${precisePercent(yes)}, ${market.outcomes[1]} ${precisePercent(no)}`}><div className="trending-card-share-track"><i style={{width:`${yes/(yes+no)*100}%`}}/><b style={{width:`${no/(yes+no)*100}%`}}/></div><div className="trending-card-share-labels"><span>{precisePercent(yes)}</span><span>{precisePercent(no)}</span></div></div>;
}

const BentoMarketCard=memo(function BentoMarketCard({group:sourceGroup,variant,saved,toggleSave,currency,fxRate,language,connection,onMarket}:{group:Market[];variant:BentoVariant;saved:boolean;toggleSave:(id:string)=>void;currency:Currency;fxRate:number|null;language:Language;connection:string;onMarket:(id:string)=>void}) {
  const displayedGroup=useMemo(()=>sourceGroup.slice(0,4),[sourceGroup]);
  const group=useQuotedMarkets(displayedGroup);
  const m=group[0];const multi=sourceGroup.length>1;const kind=marketKind(m);
  const leadingOutcome=Number(m.prices[1])>Number(m.prices[0])?1:0;
  const leadingProbability=multi?m.prices[0]:m.prices[leadingOutcome];
  return <article className={`trending-market-card trending-kind-${kind} trending-bento-${variant}`} role="link" tabIndex={0} aria-label={`Open ${m.eventTitle} market details`} onClick={event=>{if(!(event.target as HTMLElement).closest('button,a,input,select'))onMarket(m.id);}} onKeyDown={event=>{if(event.key==='Enter'&&event.target===event.currentTarget)onMarket(m.id);}}>
    <div className="trending-card-header"><CoinIcon market={m}/><div><span>{m.category.toUpperCase()} <b>· {multi?`${sourceGroup.length} OUTCOMES`:'LIVE MARKET'}</b></span><button className="trending-card-title" onClick={()=>onMarket(m.id)}>{multi?m.eventTitle:m.title}</button></div>{!multi&&<OddsGauge value={leadingProbability} label={m.outcomes[leadingOutcome]||'chance'}/>}<button className={`trending-bookmark ${saved?'saved':''}`} title={saved?'Remove bookmark':'Save market'} aria-label="Bookmark market" onClick={()=>toggleSave(m.id)}>{saved?'★':'☆'}</button></div>
    <div className="trending-bento-content"><div className="trending-bento-details">
      {multi?<><div className="trending-card-leader"><StreamValue price={leadingProbability}/><span>Leading outcome</span></div><div className="trending-candidates">{group.slice(0,4).map(candidate=><button key={candidate.id} onClick={()=>onMarket(candidate.id)}><span className="trending-candidate-name">{candidate.title.replace(/^(Will|Does) /i,'').replace(/\?$/,'')}</span><OddsGauge value={candidate.prices[0]} label={candidate.title} compact/></button>)}</div><div className="trending-prices trending-market-binary"><button className="yes" onClick={()=>onMarket(m.id)}>Yes <strong>{Number.isFinite(m.prices[0])?`${Math.round(m.prices[0]*100)}¢`:'—'}</strong></button><button className="no" onClick={()=>onMarket(m.id)}>No <strong>{Number.isFinite(m.prices[1])?`${Math.round(m.prices[1]*100)}¢`:'—'}</strong></button></div></>:<><div className={kind==='crypto'?'trending-crypto-odds':'trending-primary-odds'}><div className="trending-probability"><StreamValue price={leadingProbability}/><span>{m.outcomes[leadingOutcome]||'chance'} <small>leading</small></span></div><div className="trending-probability-track"><span style={{width:`${Math.max(0,Math.min(100,Number(leadingProbability||0)*100))}%`}}/></div></div><div className="trending-prices">{m.outcomes.slice(0,2).map((outcome,i)=><button onClick={()=>onMarket(m.id)} key={outcome} className={i===0?'yes':'no'}><span>{outcome}</span><StreamValue price={m.prices[i]}/></button>)}</div></>}
    </div>{variant==='vertical'&&<div className="trending-vertical-stats"><div><span>Total volume</span><strong>{formatReferenceMoney(sourceGroup.reduce((sum,item)=>sum+item.volumeTotal,0),currency,fxRate,language)}</strong></div><div><span>Liquidity</span><strong>{formatReferenceMoney(sourceGroup.reduce((sum,item)=>sum+item.liquidity,0),currency,fxRate,language)}</strong></div><div><span>Outcomes</span><strong>{multi?sourceGroup.length:m.outcomes.length}</strong></div></div>}{(variant==='chart'||variant==='full'||variant==='vertical')&&<div className="trending-bento-chart"><ProbabilityLine market={m} connection={connection} comparisonMarket={multi?group[1]:undefined}/></div>}</div>
    {(variant==='chart'||variant==='full'||variant==='wide')&&<CardProbabilityBar market={m}/>}
    <div className="trending-card-footer"><span>{formatReferenceMoney(sourceGroup.reduce((sum,item)=>sum+item.volume24h,0),currency,fxRate,language)} 24h Vol</span><span>{m.endDate?new Date(m.endDate).toLocaleDateString(language,{month:'short',day:'numeric'}):'Active now'}</span><button className="trending-card-discussion" aria-label={m.commentCount===undefined?'Open market discussion':`${m.commentCount} event comments — open market discussion`} title="Event comments" onClick={()=>onMarket(m.id)}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/></svg>{m.commentCount!==undefined&&<span>{new Intl.NumberFormat(language,{notation:'compact',maximumFractionDigits:1}).format(m.commentCount)}</span>}</button><button onClick={()=>onMarket(m.id)} title="Open market and live chart">↗</button></div>
  </article>;
});

export function TrendingPage({markets,connection,language,currency,fxRate,onMarket,onPromo,onCategory,topic,onTopic,hasMoreTopic,loadMoreTopic,onVisibleMarkets}:{markets:Market[];connection:string;language:Language;currency:Currency;fxRate:number|null;onMarket:(id:string)=>void;onPromo:(screen:string)=>void;onCategory:(category:string)=>void;topic:string;onTopic:(topic:string)=>void;hasMoreTopic:boolean;loadMoreTopic:()=>Promise<void>;onVisibleMarkets?:(ids:string[])=>void;catalogLoading?:boolean;catalogComplete?:boolean;retryCatalog?:()=>void}) {
  const [filter,setFilter]=useState<MarketFilter>('All markets');
  const [query,setQuery]=useState('');
  const [sort,setSort]=useState<MarketSort>('volume');
  const [timeWindow,setTimeWindow]=useState<TimeWindow>('all');
  const [marketStatus,setMarketStatus]=useState<'all'|'active'|'resolved'>('all');
  const [hideSports,setHideSports]=useState(false);
  const [hideCrypto,setHideCrypto]=useState(false);
  const [hideEarnings,setHideEarnings]=useState(false);
  const [filtersVisible,setFiltersVisible]=useState(false);
  const [searchVisible,setSearchVisible]=useState(false);
  const [savedOnly,setSavedOnly]=useState(false);
  const [openFilter,setOpenFilter]=useState<'sort'|'ends'|'status'|null>(null);
  const [saved,setSaved]=useState<Set<string>>(()=>new Set());
  const [slide,setSlide]=useState(0);
  const [prizeSlide,setPrizeSlide]=useState(0);
  const [pauseSlides,setPauseSlides]=useState(false);
  const topicStrip=useRef<HTMLDivElement>(null);
  useEffect(()=>{const timer=window.setInterval(()=>setPrizeSlide(index=>(index+1)%prizeSlides.length),7000);return ()=>window.clearInterval(timer);},[]);

  const filtered=useMemo(()=>{
    const norm=query.trim().toLowerCase();
    const now=Date.now();const maxDays=timeWindow==='daily'?1:timeWindow==='weekly'?7:timeWindow==='monthly'?30:Infinity;
    const competition=(m:Market)=>Math.abs(.5-Number(m.prices[0]??0));
    return markets.filter(m=>{
      const text=`${m.title} ${m.eventTitle} ${m.category}`.toLowerCase();
      if(filter!=='All markets'&&!text.includes(filter.toLowerCase()))return false;
      if(savedOnly&&!saved.has(m.id))return false;
      if(norm&&!text.includes(norm))return false;
      if(topic!=='All'&&m.topicGroup!==topic&&!topicAliases.some(([pattern,label])=>label===topic&&pattern.test(`${m.title} ${m.eventTitle}`)))return false;
      if(hideSports&&m.category.toLowerCase()==='sports')return false;
      if(hideCrypto&&m.category.toLowerCase()==='crypto')return false;
      if(hideEarnings&&/earnings|revenue|eps|quarterly results/i.test(text))return false;
      if(marketStatus!=='all'){
        const resolved=Boolean(m.endDate&&Date.parse(m.endDate)<now);
        if(marketStatus==='resolved'&&!resolved)return false;
        if(marketStatus==='active'&&resolved)return false;
      }
      if(Number.isFinite(maxDays)&&(!m.endDate||Date.parse(m.endDate)<now||Date.parse(m.endDate)>now+maxDays*86_400_000))return false;
      return true;
    }).sort((a,b)=>sort==='newest'?b.startTime-a.startTime:sort==='total'?b.volumeTotal-a.volumeTotal:sort==='liquidity'?b.liquidity-a.liquidity:sort==='ending'?(Date.parse(a.endDate||'')||Infinity)-(Date.parse(b.endDate||'')||Infinity):sort==='competitive'?competition(a)-competition(b):b.volume24h-a.volume24h);
  },[markets,filter,query,sort,timeWindow,marketStatus,hideSports,hideCrypto,hideEarnings,topic,savedOnly,saved]);
  const eventCards=useMemo(()=>groupEvents(filtered),[filtered]);
  const cardOrderKey=JSON.stringify([filter,query,sort,timeWindow,marketStatus,hideSports,hideCrypto,hideEarnings,topic,savedOnly,[...saved].sort()]);
  const cardOrder=useRef({key:cardOrderKey,sections:[] as string[],groups:new Map<string,string[]>(),contracts:new Map<string,string[]>()});
  if(cardOrder.current.key!==cardOrderKey)cardOrder.current={key:cardOrderKey,sections:[],groups:new Map(),contracts:new Map()};
  const bentoSections=useMemo(()=>{
    const grouped=new Map<string,Market[][]>();
    for(const group of eventCards){const cat=group[0].category||'Markets';let current=grouped.get(cat);if(!current){current=[];grouped.set(cat,current);}current.push(group);}
    const preferred=['Crypto','Sports','Politics','Elections','Finance','Economy','Geopolitics','Technology','Culture'];
    const initial=[...grouped.entries()].map(([category,groups]):[string,Market[][]]=>{
      // A portrait tile is only useful when it can show four real market outcomes.
      if(groups.length<6)return [category,groups];
      const index=groups.findIndex(group=>group.length>=4);
      return index>0?[category,[groups[index],...groups.filter((_,i)=>i!==index)]]:[category,groups];
    }).sort((a,b)=>{
      const ai=preferred.findIndex(item=>item.toLowerCase()===a[0].toLowerCase());const bi=preferred.findIndex(item=>item.toLowerCase()===b[0].toLowerCase());
      return (ai<0?99:ai)-(bi<0?99:bi);
    });
    const state=cardOrder.current;
    return appendStableOrder(initial,state.sections,entry=>entry[0]).map(([category,groups]):[string,Market[][]]=>{
      let order=state.groups.get(category);if(!order){order=[];state.groups.set(category,order);}
      const stable=appendStableOrder(groups,order,group=>group[0].eventId||group[0].eventTitle||group[0].id,homeCategoryLimit(category)).map(group=>{
        const id=group[0].eventId||group[0].eventTitle||group[0].id;let contracts=state.contracts.get(id);if(!contracts){contracts=[];state.contracts.set(id,contracts);}
        return appendStableOrder(group,contracts,m=>m.id);
      });
      return [category,stable];
    });
  },[eventCards,cardOrderKey]);
  const features=useMemo(()=>{
    const groups=groupEvents(markets);
    const chosen:Market[][]=[];const categoryCount=new Map<string,number>();
    const bitcoin=groups.find(group=>/bitcoin up or down/i.test(group[0].title)&&marketKind(group[0])==='crypto');
    if(bitcoin){chosen.push(bitcoin);categoryCount.set('crypto',1);}
    for(const group of groups){const category=group[0].category.toLowerCase();if((categoryCount.get(category)??0)>=2)continue;
      if(chosen.some(existing=>existing[0].id===group[0].id))continue;
      chosen.push(group);categoryCount.set(category,(categoryCount.get(category)??0)+1);if(chosen.length>=8)break;}
    return chosen;
  },[markets]);
  const featuredKey=features.map(group=>group[0].id).join('|');
  const rawLeadGroup=features[slide%Math.max(1,features.length)]??EMPTY_MARKETS;
  const displayedLead=useMemo(()=>rawLeadGroup.slice(0,4),[rawLeadGroup]);
  const leadGroup=useQuotedMarkets(displayedLead);
  const lead=leadGroup[0];
  const leadSide=lead&&leadGroup.length===1&&Number(lead.prices[1])>Number(lead.prices[0])?1:0;
  const subscribedIds=[...new Set([...bentoSections.flatMap(([,groups])=>groups.flatMap(group=>group.slice(0,4).map(m=>m.id))),...leadGroup.slice(0,4).map(m=>m.id)])].join(',');
  useEffect(()=>{onVisibleMarkets?.(subscribedIds?subscribedIds.split(','):[]);},[subscribedIds,onVisibleMarkets]);
  const featuredGroup=leadGroup.slice(0,5);
  useEffect(()=>setSlide(0),[featuredKey]);
  useEffect(()=>{
    if(pauseSlides||features.length<=1)return;
    const timer=window.setInterval(()=>setSlide(index=>(index+1)%features.length),8500);
    return ()=>window.clearInterval(timer);
  },[featuredKey,features.length,pauseSlides]);
  const toggleSave=useCallback((id:string)=>setSaved(previous=>{const next=new Set(previous);if(next.has(id))next.delete(id);else next.add(id);return next;}),[]);

  return <div className="atlas-trending-screen" lang={language}>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@500;600;700;800&display=swap"/>
    <style>{trendingCss}</style>
    <div className="trending-container">
      <div className="trending-topline"><div><span className="trending-kicker"><i/> MARKET INTELLIGENCE</span><h1>Trending <span>markets</span></h1><p>Live prediction probabilities, leading stories and market activity.</p></div><div className="trending-feed-state"><i className={connection==='live'?'online':''}/>{connection==='live'?'LIVE MARKET FEED':connection==='loading'?'CONNECTING':'MARKET FEED · '+connection.toUpperCase()}</div></div>
      {lead?<><div className="trending-feature-layout"><section className="trending-feature-card" onMouseEnter={()=>setPauseSlides(true)} onMouseLeave={()=>setPauseSlides(false)}>
        <div className="trending-feature-left"><div className="trending-feature-topline"><div className="trending-category"><CoinIcon market={lead}/><span>{lead.category} · FEATURED MARKET</span></div><div className="trending-slide-controls" aria-label="Featured slider controls"><button aria-label="Previous featured market" onClick={()=>setSlide(index=>(index-1+features.length)%features.length)}>‹</button><span>{slide%features.length+1} of {features.length}</span><button aria-label="Next featured market" onClick={()=>setSlide(index=>(index+1)%features.length)}>›</button></div></div><div className="trending-feature-title-row"><button className="trending-feature-title" onClick={()=>onMarket(lead.id)}>{lead.eventTitle||lead.title}</button>{leadGroup.length===1&&<OddsGauge value={lead.prices[leadSide]} label={lead.outcomes[leadSide]||'chance'}/>}</div>
          <div className="trending-feature-primary"><StreamValue price={lead.prices[leadSide]}/><span>{lead.outcomes[leadSide]||'Yes'}</span><small>● LIVE</small></div>
          <div className="trending-feature-actions">{lead.outcomes.slice(0,2).map((name,i)=><button key={name} className={i===0?'yes':'no'} onClick={()=>onMarket(lead.id)}>{name} <strong>{Number.isFinite(lead.prices[i])?`${(lead.prices[i]*100).toFixed(1)}¢`:'—'}</strong></button>)}</div>
          {featuredGroup.length>1&&<div className="trending-feature-predictions trending-feature-ring-list">{featuredGroup.slice(0,4).map(m=><button key={m.id} onClick={()=>onMarket(m.id)}><span>{m.title}</span><OddsGauge value={m.prices[0]} label={m.title} compact/></button>)}</div>}
          <div className="trending-feature-info"><span>{formatReferenceMoney(lead.volume24h,currency,fxRate,language)} 24H VOL</span><span>{lead.endDate?`ENDS ${new Date(lead.endDate).toLocaleDateString(language)}`:'OPEN MARKET'}</span></div>
        </div><ProbabilityLine market={lead} connection={connection} comparisonMarket={leadGroup.length>1?leadGroup[1]:undefined}/><div className="trending-feature-inner-dots" aria-label="Choose featured market">{features.map((group,i)=><button key={group[0].id} className={i===slide%features.length?'active':''} onClick={()=>setSlide(i)} title={group[0].eventTitle} aria-label={`Slide ${i+1}: ${group[0].eventTitle}`}/>)}</div>
      </section><aside className="trending-spotlight trending-prize-spotlight" aria-label="Proposed top trader awards"><div className="trending-prize-head"><div><span>MITMARKET TRADER AWARDS</span><strong>TOP 10 CHALLENGE</strong></div><span className="trending-prize-proposed">CONCEPT</span></div><div className="trending-prize-photo" data-prize={prizeSlides[prizeSlide].tone}>{prizeSlide===3&&<div className="trending-prize-rank-grid">{runnerUpPrizes.map((value,i)=><div key={i}><span>#{i+4}</span><strong>${value.toLocaleString('en-US')}</strong></div>)}</div>}</div><div className="trending-prize-detail"><span>RANK {prizeSlides[prizeSlide].rank} · PROPOSED PRIZE</span><h3>{prizeSlides[prizeSlide].name}</h3><b>{prizeSlides[prizeSlide].amount}</b><small>{prizeSlides[prizeSlide].detail}</small></div><div className="trending-prize-controls"><button aria-label="Previous prize" onClick={()=>setPrizeSlide(index=>(index+prizeSlides.length-1)%prizeSlides.length)}>‹</button><div>{prizeSlides.map((prize,i)=><button key={prize.rank} aria-label={`View prize ${i+1}`} className={prizeSlide===i?'active':''} onClick={()=>setPrizeSlide(i)}/>)}</div><button aria-label="Next prize" onClick={()=>setPrizeSlide(index=>(index+1)%prizeSlides.length)}>›</button></div><div className="trending-prize-winners"><span>LAST MONTH · TOP 3</span><small>Verified winner IDs pending</small><div><span>🥇 —••••—</span><span>🥈 —••••—</span><span>🥉 —••••—</span></div></div></aside></div>
      </>:<div className="trending-loading">Connecting to MITMARKET live market discovery…</div>}

      <div className="trending-promo-grid" aria-label="MITMARKET community and account tools">
        <button className="trending-promo-tile" onClick={()=>onPromo('leaderboard')}><span className="trending-promo-icon"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3.5 20v-2c0-3 2.2-5 5.5-5s5.5 2 5.5 5v2M17 6a3 3 0 0 1 0 6M18 14c2 .5 3 2 3 4v2"/></svg></span><span className="trending-promo-text"><strong>Community</strong><span className="trending-promo-metric">—</span><small>Account service not connected</small></span></button>
        <button className="trending-promo-tile" onClick={()=>onPromo('rewards_center')}><span className="trending-promo-icon"><svg viewBox="0 0 24 24"><rect x="4" y="9" width="16" height="12" rx="2"/><path d="M12 9v12M4 13h16M12 9c-5 0-7-2-6-4s5-2 6 4Zm0 0c5 0 7-2 6-4s-5-2-6 4Z"/></svg></span><span className="trending-promo-text"><strong>Bonus & Rewards</strong><span className="trending-promo-metric">$10</span><small>Verification reward · proposed</small></span></button>
        <button className="trending-promo-tile" onClick={()=>onPromo('rewards_center')}><span className="trending-promo-icon"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7 .2l2.5-2.5a5 5 0 0 0-7-7L11 5M14 11a5 5 0 0 0-7-.2l-2.5 2.5a5 5 0 0 0 7 7L13 19"/></svg></span><span className="trending-promo-text"><strong>Referrals</strong><span className="trending-promo-metric">$5</span><small>Per eligible referral · proposed</small></span></button>
        <button className="trending-promo-tile" onClick={()=>onPromo('wallet_overview')}><span className="trending-promo-icon"><svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M7 4h10M15 15h3"/></svg></span><span className="trending-promo-text"><strong>Crypto Payments</strong><span className="trending-promo-metric">USDT</span><small>Crypto payment · planned</small></span></button>
        <button className="trending-promo-tile" onClick={()=>onPromo('market_analytics')}><span className="trending-promo-icon"><svg viewBox="0 0 24 24"><path d="M3 18V6M3 18h18M6 15l5-5 4 3 5-7"/></svg></span><span className="trending-promo-text"><strong>Market Pulse</strong><span className="trending-promo-metric">{markets.length.toLocaleString('en-US')}</span><small>Markets loaded from feed</small></span></button>
      </div>

      <section className="trending-listing"><div className="trending-listing-head"><div><h2>All markets <em>{eventCards.length}</em></h2></div><div className="trending-search-controls">
          {searchVisible&&<label className="trending-inline-search"><input autoFocus aria-label="Search trending markets" placeholder="Search markets…" value={query} onChange={e=>setQuery(e.target.value)}/></label>}
          <button className={`trending-toolbar-icon ${searchVisible?'active':''}`} aria-label="Search markets" title="Search markets" onClick={()=>{setSearchVisible(value=>!value);setQuery('');}}>⌕</button>
          <button className={`trending-toolbar-icon ${filtersVisible?'active':''}`} aria-label="Show filters" aria-expanded={filtersVisible} title="Filter markets" onClick={()=>{setFiltersVisible(value=>!value);setOpenFilter(null);}}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.5" fill="#101216"/><circle cx="16" cy="17" r="2.5" fill="#101216"/></svg></button>
          <button className={`trending-toolbar-icon ${savedOnly?'active':''}`} aria-label="Show bookmarked markets" aria-pressed={savedOnly} title="Bookmarked markets" onClick={()=>setSavedOnly(value=>!value)}>{savedOnly?'★':'☆'}</button>
        </div></div>
        {filtersVisible&&<div className="trending-filterbar">
          <div className="trending-filter-wrap"><button className={`trending-filter-trigger ${openFilter==='sort'?'opened':''}`} aria-label="Sort markets" aria-expanded={openFilter==='sort'} onClick={()=>setOpenFilter(openFilter==='sort'?null:'sort')}><span className="trending-filter-glyph">↗</span><strong>{sortItems.find(item=>item.value===sort)?.label}</strong><span className="trending-filter-caret">⌄</span></button>{openFilter==='sort'&&<div className="trending-filter-menu" role="menu" aria-label="Sort markets">{sortItems.map(item=><button key={item.value} role="menuitemradio" aria-checked={sort===item.value} className={sort===item.value?'chosen':''} onClick={()=>{setSort(item.value);setOpenFilter(null);}}><span className="trending-filter-option-icon">{item.icon}</span><span>{item.label}</span>{sort===item.value&&<span className="trending-filter-selected">✓</span>}</button>)}</div>}</div>
          <div className="trending-filter-wrap"><button className={`trending-filter-trigger ${openFilter==='ends'?'opened':''}`} aria-label="Market ending date" aria-expanded={openFilter==='ends'} onClick={()=>setOpenFilter(openFilter==='ends'?null:'ends')}><strong>{endingItems.find(item=>item.value===timeWindow)?.label}</strong><span className="trending-filter-caret">⌄</span></button>{openFilter==='ends'&&<div className="trending-filter-menu trending-ends-menu" role="menu" aria-label="Market ending date">{endingItems.map(item=><button key={item.value} role="menuitemradio" aria-checked={timeWindow===item.value} className={timeWindow===item.value?'chosen':''} onClick={()=>{setTimeWindow(item.value);setOpenFilter(null);}}><span>{item.label}</span>{timeWindow===item.value&&<span className="trending-filter-selected">✓</span>}</button>)}</div>}</div>
          <div className="trending-filter-wrap"><button className={`trending-filter-trigger ${openFilter==='status'?'opened':''}`} aria-label="Market status" aria-expanded={openFilter==='status'} onClick={()=>setOpenFilter(openFilter==='status'?null:'status')}><strong>{marketStatus==='all'?'All':marketStatus==='active'?'Active':'Resolved'}</strong><span className="trending-filter-caret">⌄</span></button>{openFilter==='status'&&<div className="trending-filter-menu trending-ends-menu" role="menu" aria-label="Market status">{(['all','active','resolved'] as const).map(item=><button key={item} role="menuitemradio" aria-checked={marketStatus===item} className={marketStatus===item?'chosen':''} onClick={()=>{setMarketStatus(item);setOpenFilter(null);}}><span>{item==='all'?'All':item==='active'?'Active':'Resolved'}</span>{marketStatus===item&&<span className="trending-filter-selected">✓</span>}</button>)}</div>}</div>
          <label className="trending-check"><input type="checkbox" checked={hideSports} onChange={event=>setHideSports(event.target.checked)}/> Hide sports</label><label className="trending-check"><input type="checkbox" checked={hideCrypto} onChange={event=>setHideCrypto(event.target.checked)}/> Hide crypto</label><label className="trending-check"><input type="checkbox" checked={hideEarnings} onChange={event=>setHideEarnings(event.target.checked)}/> Hide earnings</label>
        </div>}
        <div className="trending-topics-navigation" aria-label="Market topic navigation">
          <button className="trending-topics-arrow" aria-label="Previous market topics" onClick={()=>topicStrip.current?.scrollBy({left:-520,behavior:'smooth'})}>‹</button>
          <div className="trending-topics-strip" ref={topicStrip} role="tablist" aria-label="Market topics">{requestedTopics.map(label=><button key={label} role="tab" aria-selected={topic===label} className={topic===label?'selected':''} onClick={()=>{onTopic(label);setFilter('All markets');}}>{label}</button>)}</div>
          <button className="trending-topics-arrow" aria-label="Next market topics" onClick={()=>topicStrip.current?.scrollBy({left:520,behavior:'smooth'})}>›</button>
        </div>
        <div className="trending-bento-sections">{bentoSections.map(([category,groups])=><section className="trending-bento-section" key={category} aria-label={`${category} markets`}><div className="trending-bento-section-head"><h3><CategorySymbol category={category}/>{category}</h3><button onClick={()=>onCategory(categoryDestination(category))}>See all <span>↗</span></button></div><div className="trending-market-grid" data-card-count={groups.length}>{groups.map((group,i)=><BentoMarketCard key={group[0].eventTitle||group[0].id} group={group} variant={homeCategoryLayout(groups.length,groups[0].length>=4)[i]} saved={saved.has(group[0].id)} toggleSave={toggleSave} currency={currency} fxRate={fxRate} language={language} connection={connection} onMarket={onMarket}/>)}</div></section>)}</div>
        {!filtered.length&&<p className="trending-none">{markets.length?'No matching markets. Try another category.':'Waiting for public market data…'}</p>}
        <div className="trending-scroll-sentinel">{hasMoreTopic?<button className="trending-fetch-more" onClick={()=>void loadMoreTopic()}>Load more markets</button>:null}</div>
      </section>
    </div>
  </div>;
}
