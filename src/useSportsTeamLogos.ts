import {useEffect,useState} from 'react';

type EspnTeam={displayName?:string;name?:string;shortDisplayName?:string;logos?:{href?:string;rel?:string[]}[]};
type TeamList={sports?:{leagues?:{teams?:{team:EspnTeam}[]}[]}[]};
const sources:Record<string,[string,string]>={
  basketball_nba:['basketball','nba'],basketball_wnba:['basketball','wnba'],
  americanfootball_nfl:['football','nfl'],baseball_mlb:['baseball','mlb'],icehockey_nhl:['hockey','nhl'],
  soccer_epl:['soccer','eng.1'],soccer_uefa_champs_league:['soccer','uefa.champions'],
  soccer_spain_la_liga:['soccer','esp.1'],
};
const normalize=(value:string)=>value.toLocaleLowerCase('en').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const cache=new Map<string,Record<string,string>>();
// Direct, public CDN paths keep the most popular crests visible even when the
// ESPN teams-directory API cannot be reached from an embedded preview frame.
const nba:Record<string,string>={
  'Atlanta Hawks':'atl','Boston Celtics':'bos','Brooklyn Nets':'bkn','Charlotte Hornets':'cha',
  'Chicago Bulls':'chi','Cleveland Cavaliers':'cle','Dallas Mavericks':'dal','Denver Nuggets':'den',
  'Detroit Pistons':'det','Golden State Warriors':'gs','Houston Rockets':'hou','Indiana Pacers':'ind',
  'LA Clippers':'lac','Los Angeles Clippers':'lac','Los Angeles Lakers':'lal','Memphis Grizzlies':'mem',
  'Miami Heat':'mia','Milwaukee Bucks':'mil','Minnesota Timberwolves':'min','New Orleans Pelicans':'no',
  'New York Knicks':'ny','Oklahoma City Thunder':'okc','Orlando Magic':'orl','Philadelphia 76ers':'phi',
  'Phoenix Suns':'phx','Portland Trail Blazers':'por','Sacramento Kings':'sac','San Antonio Spurs':'sa',
  'Toronto Raptors':'tor','Utah Jazz':'utah','Washington Wizards':'wsh',
};
const epl:Record<string,string>={
  'Arsenal':'359','Aston Villa':'362','AFC Bournemouth':'349','Bournemouth':'349','Brentford':'337',
  'Brighton and Hove Albion':'331','Brighton & Hove Albion':'331','Brighton':'331','Burnley':'379',
  'Chelsea':'363','Crystal Palace':'384','Everton':'368','Fulham':'370','Leeds United':'357',
  'Leicester City':'375','Liverpool':'364','Manchester City':'382','Manchester United':'360',
  'Newcastle United':'361','Nottingham Forest':'393','Sunderland':'366','Tottenham Hotspur':'367',
  'Tottenham':'367','West Ham United':'371','West Ham':'371','Wolverhampton Wanderers':'380','Wolves':'380',
  'Ipswich Town':'373','Southampton':'376','Sheffield United':'398','Luton Town':'395',
};
const immediateLogos:Record<string,Record<string,string>>={
  basketball_nba:Object.fromEntries(Object.entries(nba).map(([name,id])=>[normalize(name),`https://a.espncdn.com/i/teamlogos/nba/500/${id}.png`])),
  soccer_epl:Object.fromEntries(Object.entries(epl).map(([name,id])=>[normalize(name),`https://a.espncdn.com/i/teamlogos/soccer/500/${id}.png`])),
};

export function useSportsTeamLogos(sportKey:string){
  const [logos,setLogos]=useState<Record<string,string>>(immediateLogos[sportKey]||{});
  useEffect(()=>{
    const source=sources[sportKey];
    if(!source){setLogos(immediateLogos[sportKey]||{});return;}
    if(cache.has(sportKey)){setLogos({...immediateLogos[sportKey],...cache.get(sportKey)!});return;}
    setLogos(immediateLogos[sportKey]||{});
    const abort=new AbortController();
    fetch(`https://site.api.espn.com/apis/site/v2/sports/${source[0]}/${source[1]}/teams?limit=150`,{signal:abort.signal})
      .then(response=>{if(!response.ok)throw new Error('Team logos unavailable');return response.json() as Promise<TeamList>;})
      .then(data=>{
        const result:Record<string,string>={};
        data.sports?.forEach(s=>s.leagues?.forEach(l=>l.teams?.forEach(item=>{
          const team=item.team,logo=team.logos?.find(x=>x.rel?.includes('default'))?.href||team.logos?.[0]?.href;
          if(!logo||!logo.startsWith('https://'))return;
          for(const name of [team.displayName,team.shortDisplayName,team.name])if(name)result[normalize(name)]=logo;
        })));
        cache.set(sportKey,result);if(!abort.signal.aborted)setLogos({...immediateLogos[sportKey],...result});
      }).catch(()=>{if(!abort.signal.aborted)setLogos(immediateLogos[sportKey]||{});});
    return()=>abort.abort();
  },[sportKey]);
  return (name:string)=>logos[normalize(name)];
}
