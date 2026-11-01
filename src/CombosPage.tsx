import {useMemo,useState} from 'react';
import {decimalPrice,useSportsbookOdds,type ParlayEvent} from './parlayOdds';
import combosCss from './combos.css?raw';

const sports=[
  {label:'All',icon:'◈',keys:[]},
  {label:'NFL',icon:'◉',keys:['americanfootball_nfl']},
  {label:'College Football',icon:'▣',keys:['americanfootball_ncaaf']},
  {label:'Esports',icon:'⌘',keys:['esports_cs2','esports_dota2']},
  {label:'Soccer',icon:'⚽',keys:['soccer_epl']},
  {label:'NBA',icon:'▥',keys:['basketball_nba']},
  {label:'Tennis',icon:'◉',keys:['tennis_atp']},
  {label:'UFC',icon:'⬡',keys:['mma_mixed_martial_arts']},
  {label:'Cricket',icon:'◕',keys:['cricket_ipl']},
  {label:'MLB',icon:'◫',keys:['baseball_mlb']},
  {label:'NHL',icon:'❯',keys:['icehockey_nhl']},
  {label:'Basketball',icon:'◉',keys:['basketball_nba']},
] as const;
type Pick={eventId:string;sport:string;match:string;outcome:string;price:number};
const eventPrices=(event:ParlayEvent)=>event.bookmakers.find(book=>book.markets.some(m=>m.key==='h2h'))?.markets.find(m=>m.key==='h2h')?.outcomes||[];
const sportsName=(key:string)=>key==='soccer_epl'?'FOOTBALL':key==='basketball_nba'?'NBA':key==='americanfootball_nfl'?'NFL':key==='icehockey_nhl'?'NHL':key==='baseball_mlb'?'MLB':key==='mma_mixed_martial_arts'?'UFC':key.replaceAll('_',' ').toUpperCase();
const dateText=(value:string)=>new Date(value).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});

export function CombosPage(){
  const [sport,setSport]=useState('All');
  const [search,setSearch]=useState('');
  const [queryOpen,setQueryOpen]=useState(false);
  const [filtersOpen,setFiltersOpen]=useState(false);
  const [picks,setPicks]=useState<Pick[]>([]);
  const [refresh,setRefresh]=useState(0);
  const nfl=useSportsbookOdds('americanfootball_nfl',refresh);
  const soccer=useSportsbookOdds('soccer_epl',refresh);
  const nba=useSportsbookOdds('basketball_nba',refresh);
  const ufc=useSportsbookOdds('mma_mixed_martial_arts',refresh);
  const nhl=useSportsbookOdds('icehockey_nhl',refresh);
  const mlb=useSportsbookOdds('baseball_mlb',refresh);
  const all=useMemo(()=>[...nfl.events,...soccer.events,...nba.events,...ufc.events,...nhl.events,...mlb.events], [nfl.events,soccer.events,nba.events,ufc.events,nhl.events,mlb.events]);
  const loading=[nfl,soccer,nba,ufc,nhl,mlb].some(feed=>feed.loading);
  const display=useMemo(()=>all.filter(e=>{
    const keys=sports.find(s=>s.label===sport)?.keys||[];
    if(keys.length&&!keys.some(key=>key===e.sport_key))return false;
    if(search&&!`${e.home_team} ${e.away_team} ${e.sport_key}`.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  }).sort((a,b)=>Date.parse(a.commence_time)-Date.parse(b.commence_time)),[all,sport,search]);
  const togglePick=(event:ParlayEvent,outcome:{name:string;price:number})=>{
    setPicks(current=>{
      const existing=current.find(p=>p.eventId===event.id);
      if(existing?.outcome===outcome.name)return current.filter(p=>p.eventId!==event.id);
      return [...current.filter(p=>p.eventId!==event.id),{eventId:event.id,sport:event.sport_key,match:`${event.home_team} vs ${event.away_team}`,outcome:outcome.name,price:outcome.price}];
    });
  };
  return <div className="mit-combos" dir="ltr"><style>{combosCss}</style><div className="mit-combos-shell">
    <aside className="mit-combos-sidebar"><button className={`mit-combos-side all ${sport==='All'?'selected':''}`} onClick={()=>setSport('All')}><span><i>◈</i> All</span><b>{all.length||'—'}</b></button><div className="mit-combos-side-title">SPORTS</div>{sports.slice(1).map(s=><button key={s.label} className={`mit-combos-side ${sport===s.label?'selected':''}`} onClick={()=>setSport(s.label)}><span><i>{s.icon}</i>{s.label}</span>{s.keys.length>0&&<b>{all.filter(e=>s.keys.some(key=>key===e.sport_key)).length||''}</b>}</button>)}</aside>
    <main className="mit-combos-content"><div className="mit-combos-heading"><h1>Combos <em>Live</em></h1><div><button aria-label="Search matches" title="Search matches" onClick={()=>setQueryOpen(open=>!open)}>⌕</button><button aria-label="View information and refresh" title="Market information" onClick={()=>setFiltersOpen(open=>!open)}>☷</button></div></div>
      {queryOpen&&<input className="mit-combos-search" autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find team or competition…"/>}
      {filtersOpen&&<div className="mit-combos-info">Moneyline odds are from the current public ParlayAPI feed. Spread, total and unsupported sports will be enabled when the secure backend integration is ready. <button onClick={()=>setRefresh(v=>v+1)}>Refresh feed ↻</button></div>}
      <div className="mit-combos-columns"><span>GAME / MATCH</span><span>MONEYLINE</span><span>SPREAD</span><span>TOTAL</span></div>
      <div className="mit-combos-matches">{display.map(event=>{
        const odds=eventPrices(event).slice(0,3);
        return <section className="mit-combos-game" key={event.id}><div className="mit-combos-game-meta"><span className="mit-combos-live-circle"/><strong>{dateText(event.commence_time)}</strong><span>{sportsName(event.sport_key)} · {event.sport_key.replaceAll('_',' ')}</span><span> · {event.bookmakers.length} sources</span></div><div className="mit-combos-team-rows"><div className="mit-combos-team-column"><div><span className="mit-combos-team-icon">{event.home_team.slice(0,2).toUpperCase()}</span><strong>{event.home_team}</strong></div><div><span className="mit-combos-team-icon away">{event.away_team.slice(0,2).toUpperCase()}</span><strong>{event.away_team}</strong></div></div><div className="mit-combos-odds-columns"><div>{odds.filter(o=>o.name.toLowerCase()!=='draw').slice(0,2).map(odd=><button key={odd.name} onClick={()=>togglePick(event,odd)} className={picks.some(p=>p.eventId===event.id&&p.outcome===odd.name)?'picked':''}><small>{odd.name.slice(0,11)}</small><b>{decimalPrice(odd.price)}</b></button>)}</div><div className="mit-combos-no-price">Not in free feed</div><div className="mit-combos-no-price">Not in free feed</div></div></div>{odds.some(o=>o.name.toLowerCase()==='draw')&&<div className="mit-combos-draw">Draw: {odds.filter(o=>o.name.toLowerCase()==='draw').map(odd=><button className={picks.some(p=>p.eventId===event.id&&p.outcome===odd.name)?'picked':''} key={odd.name} onClick={()=>togglePick(event,odd)}>{decimalPrice(odd.price)}</button>)}</div>}</section>;
      })}{!display.length&&<div className="mit-combos-empty">{loading?'Loading verified fixtures…':`No verified odds available for ${sport} in the public feed.`}</div>}</div>
      <div className="mit-combos-footnote">Available markets are real bookmaker quotes. This is a selection preview; no bets or combined payouts are executed.</div>
    </main>
    <aside className="mit-combos-slip"><div className="mit-combos-slip-heading"><strong><i>◈</i> Combo</strong><span>{picks.length<2?'Select 2+ picks':`${picks.length} picks selected`}</span></div>{picks.length===0?<div className="mit-combos-slip-empty"><span>◈</span><p>No selections yet</p></div>:<><div className="mit-combos-selections">{picks.map(p=><div key={p.eventId}><button aria-label={`Remove ${p.outcome}`} onClick={()=>setPicks(items=>items.filter(item=>item.eventId!==p.eventId))}>×</button><small>{sportsName(p.sport)}</small><strong>{p.outcome}</strong><span>{p.match}</span><b>{decimalPrice(p.price)}</b></div>)}</div><div className="mit-combos-slip-bottom"><span>{picks.length<2?'Choose at least two different events.':'Preview only — not a betting ticket.'}</span><button onClick={()=>setPicks([])}>Clear selections</button></div></>}</aside>
  </div></div>;
}
