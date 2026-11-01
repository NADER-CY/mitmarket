import {MarketMosaic,MarketTile,MosaicCurrency} from './MarketMosaic';
import {useQuotedMarkets} from './marketQuotes';
import { useCallback,memo,useEffect, useMemo, useRef, useState } from 'react';
import type { Market } from './live';
import type { Language } from './i18n';
import type { Currency } from './PreferencesDialog';
import trendingCss from './trending.css?raw';

type MarketFilter = 'All markets' | 'Politics' | 'Sports' | 'Crypto' | 'Finance' | 'Geopolitics' | 'Technology' | 'Elections' | 'Economy' | 'Culture';
type MarketSort = 'volume'|'total'|'liquidity'|'newest'|'ending'|'competitive';
const filters: MarketFilter[] = ['All markets','Politics','Sports','Crypto','Finance','Geopolitics','Technology','Elections','Economy','Culture'];
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
function marketKind(m:Market){return /bitcoin up or down/i.test(m.title)?'crypto':'standard';}
function groupEvents(markets: Market[]) {
  const groups = new Map<string,Market[]>();
  for(const market of markets){const key=market.eventId||market.id;const group=groups.get(key);if(group)group.push(market);else groups.set(key,[market]);}
  return [...groups.values()].map(group=>group.length>1?[...group].sort((a,b)=>(b.prices[0]??0)-(a.prices[0]??0)):group);
}

const SectionMosaic=memo(function SectionMosaic({groups,onMarket,saved,onSave,onReveal}:{groups:Market[][];onMarket:(id:string,outcome?:number)=>void;saved:Set<string>;onSave:(id:string)=>void;onReveal:(ids:string[])=>void}){const rows=useMemo(()=>groups.flat(),[groups]);return <MarketMosaic markets={rows} onMarket={onMarket} saved={saved} onSave={onSave} onReveal={onReveal}/>;});

export function TrendingPage({markets,connection,language,currency,fxRate,onMarket,onPromo,topic,onTopic,hasMoreTopic,loadMoreTopic,onVisibleMarkets,catalogLoading=false,catalogComplete=false,retryCatalog}:{markets:Market[];connection:string;language:Language;currency:Currency;fxRate:number|null;onMarket:(id:string,outcome?:number)=>void;onPromo:(screen:string)=>void;topic:string;onTopic:(topic:string)=>void;hasMoreTopic:boolean;loadMoreTopic:()=>Promise<void>;onVisibleMarkets?:(ids:string[])=>void;catalogLoading?:boolean;catalogComplete?:boolean;retryCatalog?:()=>void}) {
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
  const [visible,setVisible]=useState(8);
  const [saved,setSaved]=useState<Set<string>>(()=>new Set());
  const [expandedIds,setExpandedIds]=useState<string[]>([]);
  const revealMarkets=useCallback((ids:string[])=>setExpandedIds(old=>{const next=[...new Set([...old,...ids])];return next.length===old.length?old:next;}),[]);
  const [slide,setSlide]=useState(0);
  const [prizeSlide,setPrizeSlide]=useState(0);
  const [pauseSlides,setPauseSlides]=useState(false);
  const sentinel=useRef<HTMLDivElement>(null);
  const topicStrip=useRef<HTMLDivElement>(null);
  const scrollDocument=sentinel.current?.ownerDocument;
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
  const bentoSections=useMemo(()=>{
    const grouped=new Map<string,Market[][]>();
    for(const group of eventCards){const cat=group[0].category||'Markets';const current=grouped.get(cat)??[];if(current.length<visible)grouped.set(cat,[...current,group]);}
    const preferred=['Crypto','Sports','Politics','Elections','Finance','Economy','Geopolitics','Technology','Culture'];
    return [...grouped.entries()].map(([category,groups]):[string,Market[][]]=>{
      // A portrait tile is only useful when it can show four real market outcomes.
      if(groups.length<6)return [category,groups];
      const index=groups.findIndex(group=>group.length>=4);
      return index>0?[category,[groups[index],...groups.filter((_,i)=>i!==index)]]:[category,groups];
    }).sort((a,b)=>{
      const ai=preferred.findIndex(item=>item.toLowerCase()===a[0].toLowerCase());const bi=preferred.findIndex(item=>item.toLowerCase()===b[0].toLowerCase());
      return (ai<0?99:ai)-(bi<0?99:bi);
    });
  },[eventCards,visible]);
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
  const subscribedIds=[...new Set([...bentoSections.flatMap(([,groups])=>groups.flatMap(group=>group.slice(0,4).map(m=>m.id))),...leadGroup.slice(0,4).map(m=>m.id),...expandedIds])].join(',');
  useEffect(()=>{onVisibleMarkets?.(subscribedIds?subscribedIds.split(','):[]);},[subscribedIds,onVisibleMarkets]);
  useEffect(()=>setSlide(0),[featuredKey]);
  useEffect(()=>{
    if(pauseSlides||features.length<=1)return;
    const timer=window.setInterval(()=>setSlide(index=>(index+1)%features.length),8500);
    return ()=>window.clearInterval(timer);
  },[featuredKey,features.length,pauseSlides]);
  useEffect(()=>setExpandedIds([]),[filter,query,sort,topic]);
  useEffect(()=>setVisible(8),[filter,query,sort,timeWindow,marketStatus,hideSports,hideCrypto,hideEarnings,topic,savedOnly]);
  useEffect(()=>{
    const el=sentinel.current;if(!el)return;
    const view=el.ownerDocument.defaultView;const observer=new (view?.IntersectionObserver??IntersectionObserver)(entries=>{
      if(entries.some(e=>e.isIntersecting))setVisible(n=>Math.min(n+6,Math.max(n,eventCards.length)));
    },{root:null,rootMargin:'700px'});
    observer.observe(el);return ()=>observer.disconnect();
  },[eventCards.length,scrollDocument]);
  useEffect(()=>{if(topic!=='All'&&hasMoreTopic&&visible>=eventCards.length&&eventCards.length>0)void loadMoreTopic();},[topic,hasMoreTopic,visible,eventCards.length,loadMoreTopic]);
  const toggleSave=useCallback((id:string)=>setSaved(previous=>{const next=new Set(previous);if(next.has(id))next.delete(id);else next.add(id);return next;}),[]);

  return <MosaicCurrency.Provider value={{currency,fxRate,language}}><div className="atlas-trending-screen" lang={language}>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@500;600;700;800&display=swap"/>
    <style>{trendingCss}</style>
    <div className="trending-container">
      <div className="trending-topline"><div><span className="trending-kicker"><i/> MARKET INTELLIGENCE</span><h1>Trending <span>markets</span></h1><p>Live prediction probabilities, leading stories and market activity.</p></div><div className="trending-feed-state"><i className={connection==='live'?'online':''}/>{connection==='live'?'LIVE MARKET FEED':connection==='loading'?'CONNECTING':'MARKET FEED · '+connection.toUpperCase()}</div></div>
      {lead?<><div className="trending-feature-layout"><section className="mm-feature-slot" onMouseEnter={()=>setPauseSlides(true)} onMouseLeave={()=>setPauseSlides(false)}><div className="mm-feature-controls"><span>FEATURED MARKET</span><div><button aria-label="Previous featured market" onClick={()=>setSlide(i=>(i-1+features.length)%features.length)}>‹</button><span>{slide%features.length+1} / {features.length}</span><button aria-label="Next featured market" onClick={()=>setSlide(i=>(i+1)%features.length)}>›</button></div></div><MarketTile key={lead.id} market={lead} onMarket={onMarket} featured/></section><aside className="trending-spotlight trending-prize-spotlight" aria-label="Proposed top trader awards"><div className="trending-prize-head"><div><span>MITMARKET TRADER AWARDS</span><strong>TOP 10 CHALLENGE</strong></div><span className="trending-prize-proposed">CONCEPT</span></div><div className="trending-prize-photo" data-prize={prizeSlides[prizeSlide].tone}>{prizeSlide===3&&<div className="trending-prize-rank-grid">{runnerUpPrizes.map((value,i)=><div key={i}><span>#{i+4}</span><strong>${value.toLocaleString('en-US')}</strong></div>)}</div>}</div><div className="trending-prize-detail"><span>RANK {prizeSlides[prizeSlide].rank} · PROPOSED PRIZE</span><h3>{prizeSlides[prizeSlide].name}</h3><b>{prizeSlides[prizeSlide].amount}</b><small>{prizeSlides[prizeSlide].detail}</small></div><div className="trending-prize-controls"><button aria-label="Previous prize" onClick={()=>setPrizeSlide(index=>(index+prizeSlides.length-1)%prizeSlides.length)}>‹</button><div>{prizeSlides.map((prize,i)=><button key={prize.rank} aria-label={`View prize ${i+1}`} className={prizeSlide===i?'active':''} onClick={()=>setPrizeSlide(i)}/>)}</div><button aria-label="Next prize" onClick={()=>setPrizeSlide(index=>(index+1)%prizeSlides.length)}>›</button></div><div className="trending-prize-winners"><span>LAST MONTH · TOP 3</span><small>Verified winner IDs pending</small><div><span>🥇 —••••—</span><span>🥈 —••••—</span><span>🥉 —••••—</span></div></div></aside></div>
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
        <div className="trending-bento-sections">{bentoSections.map(([category,groups])=><section className="trending-bento-section" key={category} aria-label={`${category} markets`}><div className="trending-bento-section-head"><h3>{category} <small>{groups.length} markets</small></h3><button onClick={()=>{onTopic('All');setFilter(filters.find(name=>name.toLowerCase()===category.toLowerCase())??'All markets');}}>See all <span>↗</span></button></div><SectionMosaic groups={groups} onMarket={onMarket} saved={saved} onSave={toggleSave} onReveal={revealMarkets}/></section>)}</div>
        {!filtered.length&&<p className="trending-none">{markets.length?'No matching markets. Try another category.':'Waiting for public market data…'}</p>}
        <div role="status" style={{color:'#98A5B5',fontSize:11,padding:'14px 0'}}>{catalogLoading?'Loading remaining Polymarket catalog pages…':catalogComplete?'Active catalog scan complete':'Catalog not complete'} <button style={{background:'none',border:0,color:'#83aaff',cursor:'pointer'}} onClick={retryCatalog}>Refresh feed</button></div>
        <div className="trending-scroll-sentinel" ref={sentinel}>{hasMoreTopic?<button className="trending-fetch-more" onClick={()=>void loadMoreTopic()}>Load more markets</button>:bentoSections.reduce((sum,[,groups])=>sum+groups.length,0)<eventCards.length?null:eventCards.length?`Showing ${eventCards.length} available events`:' '}</div>
      </section>
    </div>
  </div></MosaicCurrency.Provider>;
}
