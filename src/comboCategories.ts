import type {Market} from './marketCatalog';
export const comboCategories=[
 {label:'NFL',color:'#365cf5',pattern:/\bnfl\b|national football league/i},
 {label:'College Football',color:'#12addb',pattern:/college.football|\bncaaf\b|\bcfb\b|ncaa.football/i},
 {label:'Esports',color:'#54a6d3',pattern:/esports|counter.strike|\bcs2\b|league.of.legends|\blol\b|\bdota\b|valorant/i},
 {label:'Soccer',color:'#23b873',pattern:/soccer|\bepl\b|\bmls\b|premier.league|champions.league|la.liga|bundesliga|serie.a|ligue.1|fifa|uefa|football/i},
 {label:'NBA',color:'#b8c1d6',pattern:/\bnba\b|national.basketball.association/i},
 {label:'Tennis',color:'#b9d800',pattern:/tennis|\batp\b|\bwta\b|wimbledon/i},
 {label:'UFC',color:'#ed253b',pattern:/\bufc\b|ultimate.fighting|\bmma\b/i},
 {label:'Cricket',color:'#d62430',pattern:/cricket|\bipl\b|\bodi\b|\bt20\b/i},
 {label:'MLB',color:'#cbd4e4',pattern:/\bmlb\b|major.league.baseball/i},
 {label:'NHL',color:'#eb304b',pattern:/\bnhl\b|national.hockey.league/i},
 {label:'Basketball',color:'#f37725',pattern:/basketball|\bncaab\b|euroleague|\bwnba\b/i},
] as const;
// Provider tags decide the sport first. A market gets one sport, so generic
// football/basketball labels cannot duplicate NFL, college football or NBA.
export function comboCategory(m:Market):string|undefined{
 const priority=['NFL','College Football','Esports','NBA','UFC','MLB','NHL','Tennis','Cricket','Soccer','Basketball'];
 const select=(text:string)=>priority.find(label=>comboCategories.find(c=>c.label===label)!.pattern.test(text));
 const tagged=select((m.tags||[]).join(' '));
 return tagged||select([m.title,m.eventTitle,m.eventSlug].join(' '));
}
export function comboTopicMatches(m:Market,topic:string){return topic==='All'||comboCategory(m)===topic;}
export function comboCounts(markets:Market[]){const unique=[...new Map(markets.map(m=>[m.id,m])).values()];return Object.fromEntries([['All',unique.length],...comboCategories.map(item=>[item.label,unique.filter(m=>comboTopicMatches(m,item.label)).length])]) as Record<string,number>;}
export function compactComboCount(count:number){return count>=1000?(Math.round(count/100)/10).toFixed(1).replace(/\.0$/,'')+'K':String(count);}
