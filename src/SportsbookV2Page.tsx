import {useEffect,useMemo,useState} from 'react';
import {decimalPrice,useSportsbookOdds,type ParlayEvent} from './parlayOdds';
import {useSportsTeamLogos} from './useSportsTeamLogos';
import {LiveMatchArtwork,RadarArtwork,MotionArtwork} from './GoogleHeroArtwork';
import stylesheet from './sportsbookV2.css?raw';

const categories:[string,string,string][]=[
  ['All Sports','◫','basketball_nba'],['Football','⚽','soccer_epl'],['Basketball','◉','basketball_nba'],
  ['Tennis','◌','tennis_atp'],['Ice Hockey','▱','icehockey_nhl'],['Baseball','⚾','baseball_mlb'],
  ['American Football','◇','americanfootball_nfl'],['Esports','⌘','esports_cs2'],['Cricket','♧','cricket_ipl'],
  ['Volleyball','◈','volleyball'],['Table Tennis','◯','tabletennis'],['MMA / UFC','⬡','mma_mixed_martial_arts'],
  ['Boxing','♙','boxing_boxing'],['Golf','⚑','golf_pga_championship'],['Racing','⚐','racing_horse_racing'],
];
const leagues:[string,string,string][]=[
  ['Champions League','soccer_uefa_champs_league','⚽'],['Premier League','soccer_epl','♛'],
  ['La Liga','soccer_spain_la_liga','◈'],['NBA','basketball_nba','◉'],
  ['NFL','americanfootball_nfl','◇'],['NHL','icehockey_nhl','▱'],['MLB','baseball_mlb','⚾'],
  ['Tennis','tennis_atp','◌'],
];
function formattedTime(date:string){return new Date(date).toLocaleString('en-GB',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});}
function prices(event:ParlayEvent){const book=event.bookmakers.find(b=>b.markets.some(m=>m.key==='h2h'));return book?.markets.find(m=>m.key==='h2h')?.outcomes||[];}
function BookPriceBars({event}:{event:ParlayEvent}){
  const first=prices(event)[0]?.name;
  const samples=event.bookmakers.flatMap(book=>book.markets.find(m=>m.key==='h2h')?.outcomes.filter(o=>o.name===first).map(o=>({title:book.title,price:Number(decimalPrice(o.price))}))||[]).filter(sample=>Number.isFinite(sample.price)).slice(0,12);
  if(samples.length<2)return <div className="mms-chart-blank">Awaiting comparable bookmaker quotes</div>;
  const low=Math.min(...samples.map(x=>x.price)), high=Math.max(...samples.map(x=>x.price));
  return <div className="mms-book-chart"><div className="mms-book-chart-title">BOOKMAKER ODDS SNAPSHOT <small>{samples.length} sources</small></div><div className="mms-bars">{samples.map((s,i)=><div key={`${s.title}-${i}`} className="mms-bar-item" title={`${s.title}: ${s.price.toFixed(2)}`}><span style={{height:`${25+(s.price-low)/Math.max(.01,high-low)*65}%`}}/></div>)}</div><div className="mms-book-chart-range"><span>LOW {low.toFixed(2)}</span><span>HIGH {high.toFixed(2)}</span></div></div>;
}
function MatchCard({event,logoFor,wide=false}:{event:ParlayEvent;logoFor:(name:string)=>string|undefined;wide?:boolean}){
  const outcomes=prices(event);
  const teamBadge=(name:string,away=false)=>{const logo=logoFor(name);return <span className={`mms-team-badge ${away?'away ':''}${logo?'has-logo':''}`}><span className="mms-team-initials">{name.slice(0,2).toUpperCase()}</span>{logo&&<img src={logo} alt={`${name} crest`} loading="lazy" onError={e=>{e.currentTarget.style.display='none';}}/>}</span>};
  return <article className={`mms-card ${wide?'mms-card-wide':''}`}>
    <div className="mms-card-meta"><span><span className="mms-card-dot"/> {event.sport_key.replaceAll('_',' ').toUpperCase()}</span><time dateTime={event.commence_time}>{formattedTime(event.commence_time)}</time></div>
    <div className="mms-match-main"><div className="mms-teams"><div className="mms-team">{teamBadge(event.home_team)}<strong>{event.home_team}</strong></div><span className="mms-vs">VS</span><div className="mms-team">{teamBadge(event.away_team,true)}<strong>{event.away_team}</strong></div></div>{wide&&<BookPriceBars event={event}/>}</div>
    {wide&&<div className="mms-match-info"><span>PRE-MATCH MARKET</span><i/> <span>{event.bookmakers.length} price sources</span></div>}
    <div className="mms-odds-row">{outcomes.length?outcomes.slice(0,3).map((o,i)=><div key={`${o.name}-${i}`} className="mms-odd"><span>{o.name}</span><strong>{decimalPrice(o.price)}</strong></div>):<div className="mms-odds-unavailable">Prices currently unavailable</div>}</div>
  </article>;
}

const heroNames=['Match Center','Market Radar','Motion Flow'];
function SportsbookHero({events,loading,error}:{events:ParlayEvent[];loading:boolean;error?:string|null}){
  const [slide,setSlide]=useState(0);
  const [paused,setPaused]=useState(false);
  const [featuredId,setFeaturedId]=useState<string|null>(null);
  const soccerLogo=useSportsTeamLogos('soccer_epl');
  const nbaLogo=useSportsTeamLogos('basketball_nba');
  const heroLogo=(event:ParlayEvent|undefined,name:string)=>event?.sport_key==='soccer_epl'?soccerLogo(name):event?.sport_key==='basketball_nba'?nbaLogo(name):undefined;
  useEffect(()=>{
    if(paused||typeof window==='undefined'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const timer=window.setInterval(()=>setSlide(i=>(i+1)%3),8000);
    return()=>window.clearInterval(timer);
  },[paused]);
  const active=events.find(e=>e.id===featuredId)||events.find(e=>prices(e).length>=2)||events[0];
  const cards=events.filter(e=>e.id!==active?.id).slice(0,3);
  return <section className="mms-hero-slider" aria-label="Sportsbook highlights" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setPaused(false);}}>
    <div className="mms-hero-stage">
      <div className={`mms-hero-frame mms-hero-match ${slide===0?'is-current':''}`} aria-hidden={slide!==0}>
        <LiveMatchArtwork/>
        <div className="mms-match-banner-top"><span className="mms-match-tag"><i/> UPCOMING</span><span>{active?.sport_key.replaceAll('_',' ').toUpperCase()||'SPORTSBOOK'} <b>·</b> {active?formattedTime(active.commence_time):'AWAITING DATA'}</span><span className="mms-match-sources">{active?.bookmakers.length||0} ODDS SOURCES</span></div>
        <div className="mms-match-layout"><div className="mms-match-focus"><div className="mms-match-centerboard"><div className="mms-match-side"><div className="mms-match-crest">{heroLogo(active,active?.home_team||'')?<img src={heroLogo(active,active?.home_team||'')} alt="Home team crest"/>:<span>{active?.home_team.slice(0,2).toUpperCase()||'—'}</span>}</div><strong>{active?.home_team||'Home team'}</strong></div><div className="mms-match-middle"><span>FEATURED MATCH</span><div className="mms-match-clock">VS</div><small>{active?formattedTime(active.commence_time):loading?'Connecting to verified odds…':'No verified fixture available'}</small><div className="mms-hero-wave"><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/></div></div><div className="mms-match-side"><div className="mms-match-crest alternate">{heroLogo(active,active?.away_team||'')?<img src={heroLogo(active,active?.away_team||'')} alt="Away team crest"/>:<span>{active?.away_team.slice(0,2).toUpperCase()||'—'}</span>}</div><strong>{active?.away_team||'Away team'}</strong></div></div>
        <div className="mms-match-odds">{active&&prices(active).length?prices(active).slice(0,3).map((o,i)=><div key={`${o.name}-${i}`}><small>{o.name}</small><b>{decimalPrice(o.price)}</b></div>):<div className="mms-match-no-odds">{error?'Sports odds are temporarily unavailable':'Waiting for verified market prices'}</div>}</div></div>
        <aside className="mms-match-watch"><header><span><i/> MATCH WATCH</span><small>{cards.length} MORE</small></header>{cards.length?cards.map(event=><button type="button" key={event.id} className="mms-match-watch-entry" onClick={()=>setFeaturedId(event.id)} title="Show this verified fixture"><small>{event.sport_key.replaceAll('_',' ').toUpperCase()} · {formattedTime(event.commence_time)}</small><strong>{event.home_team}</strong><strong>{event.away_team}</strong><span>{prices(event).slice(0,2).map((odd,i)=><b key={i}>{decimalPrice(odd.price)}</b>)}</span></button>):<p>More verified fixtures appear here when available.</p>}</aside></div>
        <div className="mms-match-bottom"><span>◆ VERIFIED FIXTURES</span><span>◉ {events.length} EVENTS IN FEED</span><span>◇ LIVE MARKET REFRESH</span></div>
      </div>
      <div className={`mms-hero-frame mms-hero-radar ${slide===1?'is-current':''}`} aria-hidden={slide!==1}>
        <RadarArtwork/>
        <div className="mms-hero-intro"><span className="mms-hero-kicker">● MARKET RADAR &nbsp; | &nbsp; ODDS SIGNALS</span><h1>SPORTS<em>BOOK</em></h1><p>A real-time view of global sports markets.<br/>Follow the flow. Find your edge.</p><div className="mms-radar-tags"><span>◉ REAL-TIME ODDS</span><span>▥ MARKET MOVEMENT</span><span>◎ GLOBAL COVERAGE</span></div><button className="mms-hero-explore" onClick={()=>document.querySelector('.mms-browse-row')?.scrollIntoView({behavior:'smooth'})}>Explore markets <span>→</span></button><div className="mms-hero-availability"><i/>{loading?'Searching available odds…':`${events.length} current fixtures tracked`}</div></div>
        <div className="mms-radar-dial" aria-hidden="true"><div className="mms-radar-sweep"/><svg className="mms-radar-vector" viewBox="0 0 500 500" fill="none"><defs><linearGradient id="mms-radar-trace"><stop stopColor="#2d6bff"/><stop offset=".55" stopColor="#42b8ff"/><stop offset="1" stopColor="#16b89a"/></linearGradient><filter id="mms-radar-halo"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><circle cx="250" cy="250" r="223" stroke="#315b9e" strokeWidth="1" strokeDasharray="2 8"/><circle cx="250" cy="250" r="175" stroke="#2866bc" strokeWidth="1.2"/><circle cx="250" cy="250" r="117" stroke="#3286db" strokeWidth="1" strokeDasharray="3 7"/><path d="M250 75 A175 175 0 0 1 395 151 M108 351 A175 175 0 0 0 311 413" stroke="url(#mms-radar-trace)" strokeWidth="3" strokeLinecap="round" filter="url(#mms-radar-halo)"/><path d="M250 20V480 M20 250H480 M91 91L409 409 M91 409L409 91" stroke="#25436c" strokeWidth="1" strokeDasharray="3 9" opacity=".65"/><path d="M362 112 Q430 90 500 106 M418 238 Q460 230 530 230 M336 396 Q425 412 520 388" stroke="url(#mms-radar-trace)" strokeWidth="2" strokeLinecap="round" filter="url(#mms-radar-halo)"/><circle cx="362" cy="112" r="6" fill="#4b96ff" filter="url(#mms-radar-halo)"/><circle cx="418" cy="238" r="7" fill="#16b89a" filter="url(#mms-radar-halo)"/><circle cx="336" cy="396" r="6" fill="#4b96ff" filter="url(#mms-radar-halo)"/></svg><span className="mms-radar-point p1"/><span className="mms-radar-point p2"/><span className="mms-radar-point p3"/><div className="mms-radar-center"><span className="mms-radar-equalizer"><i/><i/><i/><i/><i/><i/><i/></span>MARKET<br/>RADAR<small>◉ DATA</small></div></div>
        <div className="mms-radar-fixtures">{[active,...cards].filter(Boolean).slice(0,3).map(e=><div className="mms-radar-fixture" key={e!.id}><small>{e!.sport_key.replaceAll('_',' ').toUpperCase()}</small><strong>{e!.home_team} <span>vs</span> {e!.away_team}</strong><div>{prices(e!).slice(0,2).map((o,i)=><b key={i}>{decimalPrice(o.price)}</b>)}</div></div>)}</div>
      </div>
      <div className={`mms-hero-frame mms-hero-flow ${slide===2?'is-current':''}`} aria-hidden={slide!==2}>
        <MotionArtwork/>
        <div className="mms-hero-intro"><span className="mms-hero-kicker">MORE THAN A GAME</span><h1>SPORTS<em>BOOK</em></h1><p>Global sports. Real-time odds.<br/>A faster, smarter way to follow every market.</p><button className="mms-hero-explore mms-flow-explore" onClick={()=>document.querySelector('.mms-browse-row')?.scrollIntoView({behavior:'smooth'})}>Explore markets <span>→</span></button><div className="mms-flow-benefits"><span>⚡ LIVE ODDS</span><span>▥ WIDE MARKETS</span><span>⬡ MARKET DATA</span></div><div className="mms-hero-availability"><i/>{loading?'Connecting to odds…':`${events.length} upcoming market opportunities`}</div></div>
        <div className="mms-flow-art" aria-hidden="true"><svg viewBox="0 0 650 260" preserveAspectRatio="none"><path d="M-40 238 C130 238 105 10 302 122 S490 222 690 -10"/><path d="M-40 268 C170 242 135 36 315 115 S500 230 690 16"/><path d="M-40 203 C130 187 180 -15 328 103 S520 184 690 -29"/><path d="M-40 292 C165 270 202 66 355 142 S520 255 690 65"/><path d="M-40 235 C156 208 126 29 319 112 S497 221 690 6"/><path d="M-40 270 C159 255 130 54 332 128 S515 237 690 39"/></svg><span className="mms-flow-node n1">◎</span><span className="mms-flow-node n2">◈</span><span className="mms-flow-node n3">◇</span></div>
        <div className="mms-flow-feed"><span>MARKETS IN MOTION</span>{[active,...cards].filter(Boolean).slice(0,3).map(e=><div key={e!.id}><small>{formattedTime(e!.commence_time)}</small><strong>{e!.home_team} <em>vs</em> {e!.away_team}</strong><b>{prices(e!)[0]?decimalPrice(prices(e!)[0].price):'—'}</b></div>)}</div>
      </div>
    </div>
    <div className="mms-hero-controls"><div className="mms-hero-tabs" role="tablist" aria-label="Sportsbook hero styles">{heroNames.map((name,i)=><button key={name} role="tab" aria-selected={slide===i} onClick={()=>setSlide(i)} className={slide===i?'active':''}><span>{String(i+1).padStart(2,'0')}</span>{name}<i/></button>)}</div><div className="mms-hero-arrows"><button aria-label="Previous banner" onClick={()=>setSlide(i=>(i+2)%3)}>‹</button><button aria-label="Next banner" onClick={()=>setSlide(i=>(i+1)%3)}>›</button></div></div>
  </section>;
}

function ShowcaseRow({title,events,sportKey,view,loading}:{title:string;events:ParlayEvent[];sportKey:string;view:'all'|'live'|'upcoming'|'results';loading:boolean}){
  const logoFor=useSportsTeamLogos(sportKey);
  const now=Date.now();
  const visible=events.filter(event=>view==='results'||view==='live'?false:view==='upcoming'?Date.parse(event.commence_time)>now:true);
  return <section className="mms-showcase"><header><h3><span className="mms-showcase-dot">◉</span> {title}</h3><span>{visible.length} AVAILABLE MATCHES</span></header>{visible.length?<div className="mms-mosaic">{visible.slice(0,5).map((event,i)=><MatchCard key={event.id} event={event} logoFor={logoFor} wide={i===0}/>)}</div>:<div className="mms-showcase-empty">{loading?'Loading market prices…':'No priced events in the selected window'}</div>}</section>;
}

export function SportsbookV2Page(){
  const [category,setCategory]=useState('All Sports');
  const [league,setLeague]=useState('basketball_nba');
  const [view,setView]=useState<'all'|'live'|'upcoming'|'results'>('all');
  const [refresh,setRefresh]=useState(0);
  const {events,loading,error,demo}=useSportsbookOdds(league,refresh);
  const soccerFeed=useSportsbookOdds('soccer_epl',refresh);
  const nflFeed=useSportsbookOdds('americanfootball_nfl',refresh);
  const nhlFeed=useSportsbookOdds('icehockey_nhl',refresh);
  const mlbFeed=useSportsbookOdds('baseball_mlb',refresh);
  const mmaFeed=useSportsbookOdds('mma_mixed_martial_arts',refresh);
  const logoFor=useSportsTeamLogos(league);
  const sorted=useMemo(()=>[...events].sort((a,b)=>Date.parse(a.commence_time)-Date.parse(b.commence_time)),[events]);
  const filtered=useMemo(()=>sorted.filter(e=>{
    const start=Date.parse(e.commence_time),now=Date.now();
    if(view==='upcoming')return start>now;
    if(view==='live')return false; // In-play state cannot be inferred from kickoff time.
    if(view==='results')return false; // Odds feed has no certified scores or final results.
    return true;
  }),[sorted,view]);
  const chooseSport=(label:string,key:string)=>{setCategory(label);setLeague(key);setView('all');};
  const allFeeds=[soccerFeed,{events,loading},nflFeed,nhlFeed,mlbFeed,mmaFeed];
  const allEvents=category==='All Sports'?[...soccerFeed.events,...events,...nflFeed.events,...nhlFeed.events,...mlbFeed.events,...mmaFeed.events]:events;
  const heroList=allEvents.slice(0,4);
  const displayedCount=category==='All Sports'?allEvents.length:events.length;
  const anyFeedLoading=allFeeds.some(feed=>'loading' in feed&&feed.loading);
  return <div className="mms" dir="ltr"><style>{stylesheet}</style>
    <div className="mms-shell">
      <aside className="mms-sidebar"><button className={`mms-side-entry ${category==='All Sports'?'active':''}`} onClick={()=>chooseSport('All Sports','basketball_nba')}><span><i>◫</i> All Sports</span><b>{displayedCount||'—'}</b></button><div className="mms-side-label">SPORTS</div>{categories.slice(1).map(([label,icon,key])=><button key={label} onClick={()=>chooseSport(label,key)} className={`mms-side-entry ${category===label?'active':''}`}><span><i>{icon}</i>{label}</span></button>)}</aside>
      <main className="mms-content">
        <SportsbookHero events={heroList} loading={loading} error={error}/>
        <div className="mms-ticker"><strong>◉ MARKET WATCH</strong>{heroList.length?heroList.map(event=><span key={event.id}>{event.home_team} <i>vs</i> {event.away_team} <em>{formattedTime(event.commence_time)}</em></span>):<span>No verified match prices available at the moment</span>}</div>
        <section className="mms-league-strip" aria-label="Popular leagues"><div className="mms-strip-title"><span>EXPLORE LEAGUES</span><small>Choose a competition</small></div><div className="mms-league-scroll">{leagues.map(([label,key,icon])=><button key={key} className={league===key?'active':''} onClick={()=>{setLeague(key);setCategory(label);setView('all');}}><span>{icon}</span>{label}</button>)}</div></section>
        <div className="mms-browse-row"><div><span className="mms-section-caption">SPORTSBOOK MARKETS</span><h2>{category}</h2></div><div className="mms-actions">{(['all','live','upcoming','results'] as const).map(tab=><button key={tab} className={view===tab?'active':''} onClick={()=>setView(tab)}>{tab==='all'?'All Games':tab[0].toUpperCase()+tab.slice(1)}</button>)}<button title="Refresh odds" onClick={()=>setRefresh(i=>i+1)} disabled={loading}>↻</button></div></div>
        <div className="mms-feed-caption"><span className={error&&category!=='All Sports'?'mms-feed-error':''}>{(category==='All Sports'?anyFeedLoading:loading)?'● Synchronizing':error&&category!=='All Sports'?'● Feed issue':'● Verified odds feed'}</span><span>{demo?'6 public sports · max 5 fixtures per sport':'Connected sportsbook odds'}</span></div>
        {error&&category!=='All Sports'&&<div className="mms-empty">{error}</div>}
        {category!=='All Sports'&&!error&&!loading&&!filtered.length&&<div className="mms-empty">{view==='results'?'Final scores are not provided by this odds endpoint.':view==='live'?'No confirmed in-play matches in this odds preview.':'No matching priced events right now.'}</div>}
        {category==='All Sports'?<>
          <ShowcaseRow title="SOCCER · PREMIER LEAGUE" sportKey="soccer_epl" events={soccerFeed.events} view={view} loading={soccerFeed.loading}/>
          <ShowcaseRow title="BASKETBALL · NBA" sportKey="basketball_nba" events={events} view={view} loading={loading}/>
          <ShowcaseRow title="AMERICAN FOOTBALL · NFL" sportKey="americanfootball_nfl" events={nflFeed.events} view={view} loading={nflFeed.loading}/>
          <ShowcaseRow title="ICE HOCKEY · NHL" sportKey="icehockey_nhl" events={nhlFeed.events} view={view} loading={nhlFeed.loading}/>
          <ShowcaseRow title="BASEBALL · MLB" sportKey="baseball_mlb" events={mlbFeed.events} view={view} loading={mlbFeed.loading}/>
          <ShowcaseRow title="COMBAT SPORTS · MMA / UFC" sportKey="mma_mixed_martial_arts" events={mmaFeed.events} view={view} loading={mmaFeed.loading}/>
        </>:!error&&<div className="mms-mosaic">{filtered.map((event,i)=><MatchCard key={event.id} event={event} logoFor={logoFor} wide={i===0}/>)}</div>}
        {loading&&category!=='All Sports'&&<div className="mms-empty">Loading verified market data…</div>}
        <div className="mms-bottom-note">Live scores and final results are not included in the current public odds API. MITMARKET never substitutes simulated results or prices. This view does not place wagers.</div>
      </main>
    </div>
  </div>;
}
