import {useState} from 'react';
import {decimalPrice,useSportsbookOdds} from './parlayOdds';
import './sportsOddsBoard.css';

const sports=[['basketball_nba','NBA'],['americanfootball_nfl','NFL'],['soccer_epl','Premier League'],['baseball_mlb','MLB'],['icehockey_nhl','NHL']];
const displayDate=(date:string)=>new Date(date).toLocaleString('en-GB',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});

export default function SportsOddsBoard(){
  const [sport,setSport]=useState('basketball_nba');
  const [refresh,setRefresh]=useState(0);
  const {events,loading,error,demo}=useSportsbookOdds(sport,refresh);
  return <section className="mm-odds-board">
    <div className="mm-odds-head"><div><span>MITMARKET SPORTSBOOK</span><h2>Live market odds</h2><p>Independent sportsbook prices · Decimal format</p></div><button onClick={()=>setRefresh(v=>v+1)} disabled={loading}>↻ Refresh</button></div>
    <nav className="mm-odds-tabs" aria-label="Sport odds categories">{sports.map(([key,label])=><button key={key} className={sport===key?'active':''} onClick={()=>setSport(key)}>{label}</button>)}</nav>
    <div className="mm-odds-meta"><span>● {loading?'CONNECTING':'DATA FEED'}</span><span>{demo?'Public preview · first 5 events':'Sportsbook feed'}</span><span>{events.length} events</span></div>
    {error&&<p className="sb-error">Odds unavailable: {error}</p>}
    {loading&&<p className="sb-loading">Loading market odds…</p>}
    <div className="mm-odds-grid">{events.map(event=>{const book=event.bookmakers.find(b=>b.markets.some(m=>m.key==='h2h'))||event.bookmakers[0];const market=book?.markets.find(m=>m.key==='h2h');return <article className="mm-odds-card" key={event.id}><div className="mm-odds-card-top"><span>{event.sport_key.replaceAll('_',' ').toUpperCase()}</span><span>{displayDate(event.commence_time)}</span></div><h3>{event.home_team} <small>vs</small> {event.away_team}</h3><div className="mm-odds-selection">{market?.outcomes.map(outcome=><div key={outcome.name}><span>{outcome.name}</span><strong>{decimalPrice(outcome.price)}</strong></div>)}{!market&&<p>Moneyline unavailable</p>}</div><div className="mm-odds-card-foot"><span>Decimal odds</span><span>{book?.last_update?`Updated ${displayDate(book.last_update)}`:'Awaiting update'}</span></div></article>;})}</div>
    {!loading&&!events.length&&!error&&<p>No odds currently available for this sport.</p>}
  </section>;
}
