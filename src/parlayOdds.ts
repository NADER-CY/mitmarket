import {useEffect, useState} from 'react';

export type ParlayOutcome={name:string;price:number};
export type ParlayMarket={key:string;outcomes:ParlayOutcome[]};
export type ParlayBook={key:string;title:string;last_update?:string;markets:ParlayMarket[]};
export type ParlayEvent={id:string;home_team:string;away_team:string;commence_time:string;sport_key:string;bookmakers:ParlayBook[]};

const DEMO_BASE='https://parlay-api.com/v1/try';
const PROXY_BASE=(import.meta.env.VITE_SPORTSBOOK_PROXY_URL||'').replace(/\/$/,'');
export const PUBLIC_DEMO_SPORTS=['soccer_epl','basketball_nba','americanfootball_nfl','icehockey_nhl','baseball_mlb','mma_mixed_martial_arts'] as const;
type OddsResult={events:ParlayEvent[];demo:boolean};
const oddsCache=new Map<string,{expires:number;value:OddsResult}>();
const pendingOdds=new Map<string,Promise<OddsResult>>();
const CACHE_MS=180_000;

function loadOdds(sportKey:string,refresh:number):Promise<OddsResult>{
  const cacheKey=`${sportKey}:${refresh}`;
  const existing=oddsCache.get(cacheKey);
  if(existing&&existing.expires>Date.now())return Promise.resolve(existing.value);
  const pending=pendingOdds.get(cacheKey);
  if(pending)return pending;
  const endpoint=PROXY_BASE?`${PROXY_BASE}/sports/${encodeURIComponent(sportKey)}/odds`:`${DEMO_BASE}/${encodeURIComponent(sportKey)}/odds`;
  const request=fetch(endpoint,{headers:{Accept:'application/json'}}).then(async response=>{
    if(!response.ok)throw new Error(`Sportsbook odds HTTP ${response.status}`);
    const data=await response.json();
    const list=Array.isArray(data)?data:Array.isArray(data.events)?data.events:[];
    const value={events:list.filter((event:ParlayEvent)=>event?.id&&Array.isArray(event.bookmakers)),demo:data.demo===true||!PROXY_BASE};
    oddsCache.set(cacheKey,{expires:Date.now()+CACHE_MS,value});
    return value;
  }).finally(()=>pendingOdds.delete(cacheKey));
  pendingOdds.set(cacheKey,request);
  return request;
}

export function decimalPrice(american:number){
  if(!Number.isFinite(american)||american===0)return '—';
  return (american>0?1+american/100:1+100/Math.abs(american)).toFixed(2);
}

export function useSportsbookOdds(sportKey:string,refresh:number){
  const [events,setEvents]=useState<ParlayEvent[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [demo,setDemo]=useState(!PROXY_BASE);
  useEffect(()=>{
    let cancelled=false;
    setLoading(true);setError('');setEvents([]);
    if(!PROXY_BASE&&!PUBLIC_DEMO_SPORTS.some(key=>key===sportKey)){
      setError('This competition is outside the six free public odds feeds.');setLoading(false);
      return;
    }
    loadOdds(sportKey,refresh)
      .then(data=>{
        if(cancelled)return;
        setEvents(data.events);
        setDemo(data.demo);
      })
      .catch(err=>{if(!cancelled)setError(err instanceof Error?err.message:'Unable to load odds');})
      .finally(()=>{if(!cancelled)setLoading(false);});
    return()=>{cancelled=true;};
  },[sportKey,refresh]);
  return {events,loading,error,demo};
}
