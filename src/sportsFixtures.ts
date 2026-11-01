import { useEffect, useState } from 'react';

export type PublicFixture={
  fixtureId:string; participant1Name:string; participant2Name:string;
  sportName:string; tournamentName:string; categoryName:string;
  statusId:number;statusName:string;startTime:string;updatedAt?:string;
  hasOdds:boolean;source:'public';homeLogo?:string;awayLogo?:string;
  homeScore?:string;awayScore?:string;scoreValid:boolean;
};

type EspnTeam={homeAway?:string;score?:string;team?:{displayName?:string;logo?:string;logos?:{href?:string}[]}};
type EspnEvent={id?:string;date?:string;name?:string;status?:{type?:{state?:string;description?:string};displayClock?:string};competitions?:{competitors?:EspnTeam[]}[]};
type EspnFeed={events?:EspnEvent[]};

const leagues:[string,string,string,string][]=[
  ['basketball','nba','Basketball','NBA'],['basketball','wnba','Basketball','WNBA'],
  ['basketball','mens-college-basketball','Basketball','College Basketball'],
  ['football','nfl','American Football','NFL'],['football','college-football','American Football','College Football'],
  ['hockey','nhl','Ice Hockey','NHL'],['baseball','mlb','Baseball','MLB'],
  ['soccer','eng.1','Soccer','Premier League'],['soccer','esp.1','Soccer','LaLiga'],
  ['soccer','ita.1','Soccer','Serie A'],['soccer','ger.1','Soccer','Bundesliga'],
  ['soccer','fra.1','Soccer','Ligue 1'],['soccer','uefa.champions','Soccer','Champions League'],
  ['soccer','uefa.europa','Soccer','Europa League'],['soccer','usa.1','Soccer','MLS'],
  ['soccer','eng.2','Soccer','Championship'],['soccer','bra.1','Soccer','Brasileirão'],
  ['soccer','arg.1','Soccer','Argentina Primera'],['soccer','ned.1','Soccer','Eredivisie'],
  ['soccer','por.1','Soccer','Primeira Liga'],['soccer','tur.1','Soccer','Süper Lig'],
  ['soccer','mex.1','Soccer','Liga MX'],
];

function dateStamp(date:Date){return `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;}
function cacheKey(sport:string,league:string,day:string){return `mm-fixtures:${sport}:${league}:${day}`;}

async function requestLeague([sport,league,sportName,tournamentName]:[string,string,string,string],day:string,signal:AbortSignal):Promise<PublicFixture[]>{
  const key=cacheKey(sport,league,day);
  try{const cached=sessionStorage.getItem(key);if(cached){const parsed=JSON.parse(cached) as {at:number;data:PublicFixture[]};if(Date.now()-parsed.at<60000)return parsed.data;}}catch{/* storage optional */}
  const url=`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard?dates=${day}&limit=100`;
  const response=await fetch(url,{signal,headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error(`Schedule HTTP ${response.status}`);
  const feed=await response.json() as EspnFeed;
  const data=(feed.events||[]).flatMap(event=>{
    const teams=event.competitions?.[0]?.competitors||[];
    const home=teams.find(x=>x.homeAway==='home')||teams[0];
    const away=teams.find(x=>x.homeAway==='away')||teams[1];
    if(!event.id||!event.date||!home||!away)return[];
    const state=event.status?.type?.state||'pre';
    return [{fixtureId:`public:${sport}:${league}:${event.id}`,participant1Name:home.team?.displayName||'Home',participant2Name:away.team?.displayName||'Away',sportName,tournamentName,categoryName:tournamentName,statusId:state==='in'?1:state==='post'?2:0,statusName:event.status?.type?.description||'Scheduled',startTime:event.date,hasOdds:false,source:'public' as const,homeLogo:home.team?.logo||home.team?.logos?.[0]?.href,awayLogo:away.team?.logo||away.team?.logos?.[0]?.href,homeScore:home.score,awayScore:away.score,scoreValid:state!=='pre'}];
  });
  try{sessionStorage.setItem(key,JSON.stringify({at:Date.now(),data}));}catch{/* quota/private browsing */}
  return data;
}

export function usePublicSportsFixtures(status:'live'|'upcoming'|'finished',date:'today'|'tomorrow'|'week'|string,refresh:number){
  const [fixtures,setFixtures]=useState<PublicFixture[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  useEffect(()=>{
    const controller=new AbortController();let active=true;setLoading(true);setError('');
    const now=new Date();if(date==='tomorrow')now.setDate(now.getDate()+1);
    if(status==='finished'&&date==='today')now.setDate(now.getDate()-1);
    const days=date==='week'?7:1;
    const dates=Array.from({length:days},(_,i)=>{const current=new Date(now);current.setDate(now.getDate()+i);return dateStamp(current);});
    const tasks=dates.flatMap(day=>leagues.map(league=>({day,league})));
    (async()=>{
      const results:PublicFixture[]=[];let success=0;
      // Concurrency cap avoids hammering the public scores service.
      for(let i=0;i<tasks.length;i+=6){
        if(controller.signal.aborted)return;
        const chunk=await Promise.allSettled(tasks.slice(i,i+6).map(t=>requestLeague(t.league,t.day,controller.signal)));
        if(!active)return;
        chunk.forEach(result=>{if(result.status==='fulfilled'){results.push(...result.value);success++;}});
        const unique=[...new Map(results.map(item=>[item.fixtureId,item])).values()];
        setFixtures(unique.filter(item=>status==='live'?item.statusId===1:status==='finished'?item.statusId===2:item.statusId===0));
        // First matches render before slower leagues finish.
        if(i===0)setLoading(false);
      }
      if(active){setLoading(false);setError(success===0?'Public sports schedules are temporarily unavailable.':'');}
    })().catch(()=>{if(active){setLoading(false);setError('Sports schedules could not be reached.');}});
    return()=>{active=false;controller.abort();};
  },[status,date,refresh]);
  return {fixtures,loading,error};
}
