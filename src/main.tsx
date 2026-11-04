import {PackedCategoryHero} from './PackedHero';
import {DesktopRuntimeContext} from './DesktopRuntime';
import {installDesktopArrowStyle} from './desktopArrowStyle';
import {ComboGameDetail} from './ComboGameDetail';
import {EsportsPage} from './EsportsPage';
import {RewardsPage} from './RewardsPage';
import {CryptoMarketDetail} from './CryptoMarketDetailV3';
import {DashboardPage} from './DashboardPage';
import {LeaderboardPage} from './LeaderboardPage';
import {ActivityPage} from './ActivityPage';
import categoryIconScale from './categoryIconScale.css?raw';
import {useQuotedMarkets} from './marketQuotes';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { HashRouter, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { humanName, screenGroup, screenNames, screenUrl, type Viewport } from './screens';
import { labels, languages, rtlLanguages, type Language } from './i18n';
import { useLiveMarkets } from './live';
import { installMarketNavigation } from './marketNavigation';
import { validCategory } from './categories';
import { useFrameBridge } from './frameBridge';
import { currencies, PreferencesDialog, type Currency } from './PreferencesDialog';
import { enhanceFrame } from './frameEnhancements';
import { formatReferenceMoney, useFxRate } from './fx';
import { TrendingPage } from './TrendingPage';
import { BreakingPage } from './BreakingPage';
import { CategoryPage } from './CategoryPage';
import { PerpsPage } from './PerpsPage';
import { CombosPage } from './CombosPage';
import { SportsbookV2Page } from './SportsbookV2Page';
import { CryptoPage } from './CryptoPage';
import { CasinoPage } from './CasinoPage';
import { MarketComments } from './MarketComments';
import { decorateFooter } from './footerContent';
import './style.css';
import './preferences.css';

function syncTrendingNav(doc:Document,screen:string){
  if(screen!=='trending')return;
  const nav=doc.querySelector('body > header');
  if(!nav)return;
  for(const item of nav.querySelectorAll<HTMLElement>('a,button')){
    if(item.closest('#mit-market-navigation-controls'))continue;
    const label=(item.dataset.atlasOriginalLabel||item.textContent||'').trim();
    if(label==='Crypto'){
      item.style.setProperty('background','transparent','important');
      item.style.setProperty('color','#98A5B5','important');
      item.style.setProperty('border-color','transparent','important');
    }
    if(label==='Trending'){
      item.style.setProperty('background','transparent','important');
      item.style.setProperty('color','#1463ff','important');
      item.style.setProperty('border-bottom','2px solid #1463ff','important');
    }
  }
}

function App() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const current = screenNames.find(item => item === name) ?? 'trending';
  const viewport: Viewport = searchParams.get('view') === 'mobile' || (!searchParams.has('view') && window.innerWidth <= 700) ? 'mobile' : 'desktop';
  const category = validCategory(searchParams.get('category'));
  const commonScreens:Record<string,string>={combos:'combos',perps:'perps',breaking:'breaking',sportsbook:'sports',crypto_category:'crypto',live_activity:'live_activity',leaderboard:'leaderboard',portfolio_dashboard:'portfolio_dashboard',rewards_center:'rewards_center'};
  const commonCategory=current==='explore'?category:commonScreens[current];
  const [commonMount,setCommonMount]=useState<HTMLElement|null>(null);
  const marketId = searchParams.get('market');
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [trendingMount,setTrendingMount] = useState<HTMLElement|null>(null);
  const [breakingMount,setBreakingMount] = useState<HTMLElement|null>(null);
  const [perpsMount,setPerpsMount] = useState<HTMLElement|null>(null);
  const [combosMount,setCombosMount] = useState<HTMLElement|null>(null);
  const [sportsbookMount,setSportsbookMount] = useState<HTMLElement|null>(null);
  const [casinoMount,setCasinoMount] = useState<HTMLElement|null>(null);
  const [cryptoMount,setCryptoMount] = useState<HTMLElement|null>(null);
  const [commentsMount,setCommentsMount] = useState<HTMLElement|null>(null);
  const [cryptoDetailMount,setCryptoDetailMount] = useState<HTMLElement|null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('atlas-language');
    return languages.find(([code]) => code === saved)?.[0] ?? 'en';
  });
  const [activePanel, setActivePanel] = useState<'screens' | 'live' | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('atlas-currency');
    return currencies.find(([code]) => code === saved)?.[0] ?? 'USDT';
  });
  const fx = useFxRate(currency);
  const [filter, setFilter] = useState('');
  const [trendingTopic,setTrendingTopic] = useState('All');
  const [politicsTopic,setPoliticsTopic]=useState('All');
  const [iranTopic,setIranTopic]=useState('All');
  const [sportsTopic,setSportsTopic]=useState('Live');
  const [visibleIds,setVisibleIds]=useState<string[]>([]);
  const { comboHasMore,comboLoadingMore,loadMoreCombo,markets, connection, error, updatedAt,hasMoreTopic,loadMoreTopic,catalogLoading,catalogComplete,loadedEvents,retryCatalog } = useLiveMarkets(commonCategory==='crypto'?'crypto':commonCategory?validCategory(commonCategory):current==='trending'?'trending':current==='breaking'?'breaking':current==='sportsbook'?'sports':current==='crypto_category'?'crypto':category,marketId,commonCategory==='politics'?politicsTopic:commonCategory==='sports'?sportsTopic:commonCategory==='iran'?iranTopic:trendingTopic,visibleIds,viewport==='desktop'&&current==='trending');
  const selectedRows=useMemo(()=>{const market=markets.find(market=>market.id===marketId);return market?[market]:[];},[markets,marketId]);
  const selectedMarket=useQuotedMarkets(selectedRows)[0];
  const l = labels(language);
  const direction = rtlLanguages.includes(language) ? 'rtl' : 'ltr';
  const filtered = useMemo(() => markets.filter(market => `${market.title} ${market.category}`.toLowerCase().includes(filter.toLowerCase())).slice(0, 50), [markets, filter]);

  function changeLanguage(next: Language) {
    setLanguage(next);
    localStorage.setItem('atlas-language', next);
    document.documentElement.lang = next;
  }
  function changeCurrency(next: Currency) { setCurrency(next); localStorage.setItem('atlas-currency', next); }
  function chooseScreen(next: string) { navigate(`/preview/${next}?view=${viewport}`); setActivePanel(null); }
  function chooseTrending() { navigate(`/preview/trending?view=${viewport}`); setActivePanel(null); }
  function chooseCategory(next: string) { if (next === 'trending') { chooseTrending(); return; }if(next==='perps'){chooseScreen('perps');return;}if(next==='combos'){chooseScreen('combos');return;} if(next==='breaking'){chooseScreen('breaking');return;}if(next==='sports'){chooseScreen('sportsbook');return;}if(next==='crypto'){chooseScreen('crypto_category');return;} navigate(`/preview/explore?view=${viewport}&category=${next}`); setActivePanel(null); setFilter(''); }
  const openMarket=useCallback((id: string) => {
    const selected=markets.find(m=>m.id===id);
    const known=['crypto','sports','politics','finance','geopolitics','technology','elections','economy','culture','esports','iran','weather','mentions','art'];
    const named=selected?.category?.toLowerCase().trim();
    const actualCategory=selected?.categoryIds?.find(value=>known.includes(value))||(named&&known.includes(named)?named:undefined);
    const fallback=current==='crypto_category'?'crypto':current==='sportsbook'?'sports':current==='combos'?'combos':category;
    const destination=actualCategory||fallback;
    navigate(`/preview/binary_market?view=${viewport}&category=${encodeURIComponent(destination)}&market=${encodeURIComponent(id)}`);
    setActivePanel(null);
  },[navigate,current,viewport,category,markets]);

  const bridge = useFrameBridge({frame: frameRef, screen: current, category, markets, selected: current==='binary_market'&&(category==='crypto'||category==='combos')?undefined:selectedMarket, viewport, onCategory: chooseCategory, onMarket: openMarket, onTrending: chooseTrending, currency, fxRate: fx.rate, language});

  useEffect(()=>{const doc=frameRef.current?.contentDocument;if(!doc)return;const frame=window.requestAnimationFrame(()=>{doc.getElementById('mit-template-loading')?.remove();});return()=>window.cancelAnimationFrame(frame);},[commonMount,trendingMount,breakingMount,cryptoMount,sportsbookMount,casinoMount,commentsMount,current,category]);

  function handleFrameLoad() {
    bridge.onLoad();
    installHeaderPreferences();
    const doc = frameRef.current?.contentDocument;
    if (!doc?.body) return;
    if(viewport==='desktop')installDesktopArrowStyle(doc);
    if(!doc.getElementById('mit-category-icon-scale')){const style=doc.createElement('style');style.id='mit-category-icon-scale';style.textContent=categoryIconScale;doc.head.appendChild(style);}
    installMitmarketBrand(doc);
    if(!commonCategory&&current!=='trending')installPercentColorPolicy(doc);
    enhanceFrame(doc,language,chooseScreen,chooseCategory);
    installSportsbookNavigation(doc);
    installMarketNavigation(doc,current,category,chooseCategory,chooseScreen,viewport==='desktop');
    syncTrendingNav(doc,current);
    decorateFooter(doc,language,markets,openMarket,chooseCategory,viewport==='desktop',chooseScreen,()=>setPreferencesOpen(true));
    if(commonCategory){
      const main=doc.querySelector('main');
      if(main){const mount=doc.createElement('div');main.replaceChildren(mount);main.removeAttribute('class');main.style.cssText='display:block;background:#000;min-height:100vh;padding:96px 0 0;max-width:none;';setCommonMount(mount);}
      return;
    }
    setCommonMount(null);
    if (current === 'trending' && viewport === 'desktop') {
      const main = doc.querySelector('main');
      if (main) {
        const mount = doc.createElement('div');
        mount.className = 'atlas-trending-mount';
        main.replaceChildren(mount);
        main.removeAttribute('class');
        main.style.cssText='display:block;background:#000;min-height:100vh;padding:96px 0 0;max-width:none;';
        setTrendingMount(mount);
      }
    } else setTrendingMount(null);
    if(current==='breaking'){
      const main=doc.querySelector('main');
      if(main){const mount=doc.createElement('div');mount.className='mit-breaking-mount';main.replaceChildren(mount);main.removeAttribute('class');main.style.cssText='display:block;background:#000;min-height:100vh;padding:96px 0 0;max-width:none;';setBreakingMount(mount);}
    }else setBreakingMount(null);
    if(current==='perps'){
      const main=doc.querySelector('main');
      if(main){const mount=doc.createElement('div');mount.className='mit-perps-mount';main.replaceChildren(mount);main.removeAttribute('class');main.style.cssText='display:block;background:#000;min-height:100vh;padding:96px 0 0;max-width:none;';setPerpsMount(mount);}
    }else setPerpsMount(null);
    if(current==='combos'){
      const main=doc.querySelector('main');
      if(main){const mount=doc.createElement('div');mount.className='mit-combos-mount';main.replaceChildren(mount);main.removeAttribute('class');main.style.cssText='display:block;background:#0b0c10;min-height:100vh;padding:96px 0 0;max-width:none;';setCombosMount(mount);}
    }else setCombosMount(null);
    if (current === 'sportsbook') {
      const main=doc.querySelector('main');
      if(main){const mount=doc.createElement('div');mount.className='atlas-sportsbook-mount';main.replaceChildren(mount);main.removeAttribute('class');main.style.cssText='display:block;background:#000;min-height:100vh;padding:96px 0 0;max-width:none;';setSportsbookMount(mount);}
    } else setSportsbookMount(null);
    if (current === 'casino') {
      const main=doc.querySelector('main');
      if(main){const mount=doc.createElement('div');mount.className='mit-casino-mount';main.replaceChildren(mount);main.removeAttribute('class');main.style.cssText='display:block;background:#000;min-height:100vh;padding:96px 0 0;max-width:none;';setCasinoMount(mount);}
    } else setCasinoMount(null);
    if(current==='crypto_category'){
      const main=doc.querySelector('main');
      if(main){const mount=doc.createElement('div');mount.className='atlas-crypto-mount';main.replaceChildren(mount);main.removeAttribute('class');main.style.cssText='display:block;background:#000;min-height:100vh;padding:96px 0 0;max-width:none;';setCryptoMount(mount);}
    }else setCryptoMount(null);
    if(!commonCategory&&(current!=='trending'||viewport==='mobile'))window.requestAnimationFrame(()=>doc.getElementById('mit-template-loading')?.remove());
    if(current==='binary_market'&&(category==='crypto'||category==='combos')){
      const main=doc.querySelector('main');
      if(main){const mount=doc.createElement('div');main.replaceChildren(mount);main.removeAttribute('class');main.style.cssText='display:block;background:#0a0c10;min-height:100vh;padding:96px 0 0;max-width:none;';setCryptoDetailMount(mount);}
      setCommentsMount(null);
    }else if(current==='binary_market'){
      const main=doc.querySelector('main');
      if(main){const mount=doc.createElement('div');mount.className='atlas-market-comments-mount';main.appendChild(mount);setCommentsMount(mount);}
      setCryptoDetailMount(null);
    }else {setCommentsMount(null);setCryptoDetailMount(null);}
  }

  useEffect(() => {
    const doc = frameRef.current?.contentDocument;
    if (doc?.body) { enhanceFrame(doc,language,chooseScreen,chooseCategory);installSportsbookNavigation(doc);installMarketNavigation(doc,current,category,chooseCategory,chooseScreen,viewport==='desktop');syncTrendingNav(doc,current);decorateFooter(doc,language,markets,openMarket,chooseCategory,viewport==='desktop',chooseScreen,()=>setPreferencesOpen(true)); }
  }, [language, current, viewport, category]);
  useEffect(() => {
    const doc=frameRef.current?.contentDocument;
    if(doc){const header=doc.querySelector('body > header');const volume=header?.querySelector<HTMLElement>('[data-live-header-volume]')||[...header?.querySelectorAll<HTMLElement>('strong')||[]].find(n=>/24H/.test(n.textContent||''));if(volume){volume.dataset.liveHeaderVolume='true';volume.title='24-hour volume of the loaded contracts';volume.textContent=markets.length?formatReferenceMoney(markets.reduce((sum,m)=>sum+(Number.isFinite(m.volume24h)?m.volume24h:0),0),currency,fx.rate,language)+' 24H':'— 24H';}}
    if(doc?.getElementById('atlas-enhanced-footer')) decorateFooter(doc,language,markets,openMarket,chooseCategory,viewport==='desktop',chooseScreen,()=>setPreferencesOpen(true));
  },[markets,language]);

  function installHeaderPreferences() {
    const doc = frameRef.current?.contentDocument;
    const header = doc?.querySelector('body > header') ?? doc?.querySelector('header');
    if (!doc || !header || header.querySelector('.atlas-header-preferences')) return;
    const avatarSymbol = [...header.querySelectorAll('span')].find(element => element.textContent?.trim() === 'person');
    const avatar = avatarSymbol?.closest<HTMLElement>('.rounded-full') ?? avatarSymbol?.parentElement;
    const accountGroup = avatar?.parentElement;
    const target = accountGroup?.textContent?.includes('0x') ? accountGroup : avatar;
    if (!target?.parentElement) return;
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'atlas-header-preferences';
    button.title = 'Language / Currency';
    button.setAttribute('aria-label', 'Language and Currency');
    button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-3 3-4.5 6-4.5 9s1.5 6 4.5 9M12 3c3 3 4.5 6 4.5 9s-1.5 6-4.5 9"/></svg>';
    button.addEventListener('click', () => setPreferencesOpen(true));
    target.insertAdjacentElement('afterend', button);
    const style = doc.createElement('style');
    style.textContent = '.atlas-header-preferences{display:flex;align-items:center;justify-content:center;flex:0 0 auto;width:34px;height:34px;border:0;border-radius:7px;padding:6px;background:transparent;color:#F4F6FA;cursor:pointer;margin-left:8px}.atlas-header-preferences svg{display:block;width:21px;height:21px}.atlas-header-preferences:hover{color:#EAA343;background:#101216}@media(max-width:600px){.atlas-header-preferences{width:30px;height:30px;padding:5px;margin-left:2px}.atlas-header-preferences svg{width:19px;height:19px}}';
    doc.head.appendChild(style);
  }

  function installMitmarketBrand(doc:Document){
    doc.title='MITMARKET | Prediction Markets';
    const header=doc.querySelector('body > header')??doc.querySelector('header');
    if(!header||header.querySelector('.mitmarket-brand'))return;
    const oldLogo=header.querySelector<HTMLImageElement>('img[alt*="Logo"],img[alt*="logo"]');
    const textNode=[...header.querySelectorAll('span,strong,a')].find(node=>node.textContent?.trim()==='MITMARKET');
    const target=oldLogo?.parentElement??textNode?.parentElement;
    if(!target)return;
    const brand=doc.createElement('div');
    brand.className='mitmarket-brand';
    brand.setAttribute('aria-label','MITMARKET');
    brand.innerHTML='<img src="/mitmarket-mark.svg" alt="M"/><span>ITMARKET</span>';
    target.replaceChildren(brand);
    const css=doc.createElement('style');
    css.textContent='.mitmarket-brand{display:flex;align-items:center;gap:7px;white-space:nowrap;color:#f5f7fc;font-family:Inter,Arial,sans-serif;font-size:20px;letter-spacing:1px;font-weight:800;line-height:1}.mitmarket-brand img{height:34px;width:35px;flex:none;object-fit:contain}@media(max-width:600px){.mitmarket-brand{font-size:16px;gap:5px}.mitmarket-brand img{height:28px;width:29px}}';
    doc.head.appendChild(css);
  }

  function installPercentColorPolicy(doc:Document){
    if(!doc.body||doc.body.dataset.mitmarketPercentColors==='ready')return;
    doc.body.dataset.mitmarketPercentColors='ready';
    const isPercent=(value:string|null|undefined)=>/^\s*[+−-]?\d{1,3}(?:[.,]\d+)?\s*%\s*$/.test(value||'');
    const colorNode=(node:Node)=>{
      if(node.nodeType===Node.TEXT_NODE){
        const parent=node.parentElement;
        if(parent&&isPercent(parent.textContent)){
          if(parent.namespaceURI==='http://www.w3.org/2000/svg')parent.setAttribute('fill','#0bba74');
          else parent.style?.setProperty('color','#0bba74','important');
        }
        return;
      }
      if(node.nodeType!==1)return;
      const element=node as Element;
      if(element.children.length===0&&isPercent(element.textContent)){
        if(element.namespaceURI==='http://www.w3.org/2000/svg')element.setAttribute('fill','#0bba74');
        else (element as HTMLElement).style.setProperty('color','#0bba74','important');
      }
      const walker=doc.createTreeWalker(node,NodeFilter.SHOW_TEXT);
      let current:Node|null;
      while((current=walker.nextNode()))colorNode(current);
    };
    colorNode(doc.body);
    const observer=new MutationObserver(records=>{
      for(const record of records){
        if(record.type==='characterData')colorNode(record.target);
        for(const child of record.addedNodes)colorNode(child);
      }
    });
    observer.observe(doc.body,{childList:true,subtree:true,characterData:true});
  }

  function installSportsbookNavigation(doc:Document){
    const nav=doc.querySelector('body > header nav')??doc.querySelector('header nav');
    if(!nav)return;
    nav.querySelectorAll('.mit-header-combos,.mit-header-sportsbook,.mit-header-casino').forEach(item=>item.remove());
    if(!doc.getElementById('mit-header-nav-style')){const style=doc.createElement('style');style.id='mit-header-nav-style';style.textContent='.mit-header-navigation{background:transparent;border:0;border-bottom:2px solid transparent;color:#9da8b8;padding:10px 5px;cursor:pointer;font-size:14px;font-weight:650;white-space:nowrap}.mit-header-navigation:hover{color:#e59a3c}.mit-header-navigation.atlas-active{color:#1463ff;border-bottom-color:#1463ff}@media(max-width:720px){.mit-header-navigation{font-size:13px;padding:7px 5px}}';doc.head.appendChild(style);}
  }

  return <DesktopRuntimeContext.Provider value={viewport==='desktop'}><div className="atlas-app">
    <div className="stitch-stage"><iframe ref={frameRef} key={`${current}:${category}:${screenUrl(current, viewport)}`} onLoad={handleFrameLoad} title={`MITMARKET ${current} ${viewport}`} src={screenUrl(current, viewport)} className={`original-screen ${viewport}`} /></div>
    {commonCategory && commonMount && (commonCategory==='rewards_center'?createPortal(<RewardsPage/>,commonMount):commonCategory==='portfolio_dashboard'?createPortal(<DashboardPage onMarket={openMarket}/>,commonMount):commonCategory==='leaderboard'?createPortal(<LeaderboardPage/>,commonMount):commonCategory==='live_activity'?createPortal(<ActivityPage/>,commonMount):commonCategory==='esports'?createPortal(<EsportsPage markets={markets} connection={connection} error={error} loading={catalogLoading} complete={catalogComplete} onMarket={openMarket} onVisibleMarkets={setVisibleIds} retry={retryCatalog}/>,commonMount):commonCategory==='crypto'?createPortal(<CryptoPage polymarket={markets} connection={connection} onMarket={openMarket} onVisibleMarkets={setVisibleIds} catalogLoading={catalogLoading} catalogComplete={catalogComplete} retryCatalog={retryCatalog}/>,commonMount):createPortal(<CategoryPage selectedTopic={commonCategory==='sports'?sportsTopic:commonCategory==='iran'?iranTopic:politicsTopic} onTopicChange={commonCategory==='sports'?setSportsTopic:commonCategory==='iran'?setIranTopic:setPoliticsTopic} remoteHasMore={commonCategory==='combos'&&comboHasMore} loadingMore={comboLoadingMore} onLoadMore={loadMoreCombo} key={commonCategory} category={commonCategory} markets={markets} connection={connection} error={error} onMarket={openMarket} onVisibleMarkets={setVisibleIds} catalogLoading={catalogLoading} catalogComplete={catalogComplete} loadedEvents={loadedEvents} retryCatalog={retryCatalog} workspace={commonCategory==='combos'?<CombosPage/>:commonCategory==='sports'?<SportsbookV2Page/>:undefined}/>,commonMount))}
    {!commonCategory && current === 'trending' && trendingMount && createPortal(<TrendingPage markets={markets} connection={connection} language={language} currency={currency} fxRate={fx.rate} onMarket={openMarket} onPromo={chooseScreen} onCategory={chooseCategory} topic={trendingTopic} onTopic={setTrendingTopic} hasMoreTopic={hasMoreTopic} loadMoreTopic={loadMoreTopic} onVisibleMarkets={setVisibleIds} catalogLoading={catalogLoading} catalogComplete={catalogComplete} retryCatalog={retryCatalog}/>,trendingMount)}
    {!commonCategory && current === 'breaking' && breakingMount && createPortal(<BreakingPage markets={markets} connection={connection} error={error} updatedAt={updatedAt} onMarket={openMarket}/>,breakingMount)}
    {!commonCategory && current === 'perps' && perpsMount && createPortal(<PerpsPage/>,perpsMount)}
    {!commonCategory && current === 'combos' && combosMount && createPortal(<><div style={{maxWidth:1440,margin:'16px auto',padding:'0 24px'}}><PackedCategoryHero category="combos" markets={markets} connection={connection} onMarket={openMarket}/></div><CombosPage/></>,combosMount)}
    {!commonCategory && current === 'sportsbook' && sportsbookMount && createPortal(<SportsbookV2Page/>,sportsbookMount)}
    {current === 'casino' && casinoMount && createPortal(<CasinoPage/>,casinoMount)}
    {!commonCategory && current === 'crypto_category' && cryptoMount && createPortal(<CryptoPage polymarket={markets} connection={connection} onMarket={openMarket}/>,cryptoMount)}
    {current === 'binary_market' && commentsMount && selectedMarket && createPortal(<MarketComments market={selectedMarket} language={language}/>,commentsMount)}
    {current === 'binary_market' && category==='combos' && cryptoDetailMount && marketId && createPortal(<ComboGameDetail key={marketId} id={marketId} market={selectedMarket} language={language} related={markets} onMarket={openMarket} onBack={()=>chooseScreen('combos')}/>,cryptoDetailMount)}
    {current === 'binary_market' && category==='crypto' && cryptoDetailMount && marketId && createPortal(<CryptoMarketDetail key={marketId} id={marketId} market={selectedMarket} language={language} related={markets} onMarket={openMarket} onBack={()=>chooseScreen('crypto_category')}/>,cryptoDetailMount)}
    {preferencesOpen && <PreferencesDialog language={language} currency={currency} fx={fx} onLanguage={changeLanguage} onCurrency={changeCurrency} onClose={() => setPreferencesOpen(false)}/>}
    {activePanel && <section className="atlas-panel" dir={direction} aria-label={activePanel === 'live' ? l.live : l.screens}>
      <header className="panel-heading"><div><span className="panel-eyebrow">MITMARKET</span><h2>{activePanel === 'live' ? l.live : l.screens}</h2></div><button className="panel-close" onClick={() => setActivePanel(null)} aria-label="Close panel">×</button></header>
      {activePanel === 'screens' ? <div className="panel-content">
        {[...new Set(screenNames.map(screenGroup))].map(group => <div key={group} className="screen-group"><h3>{group}</h3>{screenNames.filter(screen => screenGroup(screen) === group).map(screen => <button className={current === screen ? 'selected-screen' : ''} key={screen} onClick={() => chooseScreen(screen)}>{humanName(screen)}</button>)}</div>)}
      </div> : <>
        <div className="feed-meta"><span className={`connection-dot ${connection}`} /> {l.status}: <strong>{connection.toUpperCase()}</strong><span>{markets.length} {l.markets}</span></div>
        <div className="feed-source">{l.data} · {updatedAt ? new Date(updatedAt).toLocaleTimeString(language) : '—'} · {currency} {fx.status === 'ready' ? (fx.date ? `FX ${fx.date}` : '') : fx.status === 'loading' ? 'FX loading' : 'FX unavailable'}</div>
        {error && <p className="feed-error">{error}</p>}
        <input className="market-search" aria-label={l.search} placeholder={l.search} value={filter} onChange={event => setFilter(event.target.value)} />
        <div className="panel-content market-list">
          {filtered.length === 0 && <div className="empty-state">{connection === 'loading' ? 'Loading MITMARKET markets…' : l.noResults}</div>}
          {filtered.map(market => <article className="live-card" key={market.id} role="button" tabIndex={0} onClick={() => openMarket(market.id)} onKeyDown={event => { if (event.key === 'Enter') openMarket(market.id); }}>
            <div className="card-meta"><span>{market.category}</span><span>{l.volume}: {formatReferenceMoney(market.volume24h,currency,fx.rate,language)}</span></div>
            <h3>{market.title}</h3><div className="outcomes">{market.outcomes.slice(0,3).map((outcome,i) => <div key={outcome} className="outcome"><span>{outcome}</span><strong>{Number.isFinite(market.prices[i]) ? `${(market.prices[i]*100).toFixed(1)}%` : '—'}</strong></div>)}</div>
          </article>)}
        </div><p className="feed-disclaimer">Public reference prices only. MITMARKET trading is not connected; no orders are submitted.</p>
      </>}
    </section>}
  </div></DesktopRuntimeContext.Provider>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><HashRouter useTransitions={false}><Routes>
  <Route path="/preview/:name" element={<App/>}/><Route path="*" element={<Navigate to="/preview/trending" replace/>}/>
</Routes></HashRouter></React.StrictMode>);
