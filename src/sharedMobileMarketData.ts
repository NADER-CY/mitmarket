import {useEffect,useState} from 'react';

export type Market = {change24h?:number;liquidity?:number;eventId?:string;eventTitle?:string;id:string;title:string;category:string;image:string;yes:number;no:number;volume:number;endDate:string;slug:string;token:string};
type RawMarket = {oneDayPriceChange?:number;liquidityNum?:number;liquidity?:number|string;id?:string;question?:string;outcomePrices?:string|string[];clobTokenIds?:string|string[];volumeNum?:number;volume?:number|string;endDate?:string;slug?:string;active?:boolean;closed?:boolean};
type RawEvent = {id?:string;title?:string;slug?:string;image?:string;icon?:string;volume?:number;volume24hr?:number;markets?:RawMarket[];tags?:{label?:string;slug?:string}[]};

function parsePrices(prices:RawMarket['outcomePrices']):number[]{
  try {const v=typeof prices==='string'?JSON.parse(prices):prices;return Array.isArray(v)?v.map(Number):[];}catch{return [];}
}
function normalize(event:RawEvent):Market|null {
  const m=event.markets?.find(x=>x.active!==false&&x.closed!==true)||event.markets?.[0];
  if(!m)return null;
  const prices=parsePrices(m.outcomePrices);if(prices.length<2||!prices.every(Number.isFinite))return null;
  const question=m.question||event.title||'';if(!question)return null;const title=event.title&&/^(map |game |games |spread:|total |both teams|any player|first blood)/i.test(question)?`${event.title} · ${question}`:question;
  const rawTokens=m.clobTokenIds;let tokens:string[]=[];try{const parsed=typeof rawTokens==='string'?JSON.parse(rawTokens):rawTokens;tokens=Array.isArray(parsed)?parsed.map(String):[];}catch{/* no valid CLOB token */}
  return {change24h:m.oneDayPriceChange,liquidity:Number(m.liquidityNum??m.liquidity)||undefined,eventId:String(event.id||event.slug||m.id),eventTitle:event.title||title,id:String(m.id||event.id||title),title,category:event.tags?.[0]?.label||'Markets',image:event.image||event.icon||'',yes:Math.round(prices[0]*100),no:Math.round(prices[1]*100),volume:Number(m.volumeNum||m.volume||event.volume||0),endDate:m.endDate||'',slug:event.slug||m.slug||'',token:tokens[0]||''};
}
const BASE='https://gamma-api.polymarket.com';
const memory=new Map<string,{at:number;markets:Market[]}>();
const requests=new Map<string,Promise<Market[]>>();
const tagIds:Record<string,number>={politics:2,sports:1,crypto:21,esports:64,iran:78,finance:120,geopolitics:100265,tech:1401,elections:144,culture:596,economy:100328,weather:84,mentions:100343,art:1422};
const tags:Record<string,string>={politics:'politics',sports:'sports',crypto:'crypto',esports:'esports',iran:'iran',finance:'finance',geopolitics:'geopolitics',tech:'tech',elections:'elections',culture:'pop-culture',economy:'economy',weather:'weather',mentions:'mention-markets',art:'art'};
async function catalog(section:string):Promise<Market[]> {
  const key=tags[section]?section:['new','breaking'].includes(section)?section:'trending';
  const cached=memory.get(key);if(cached&&Date.now()-cached.at<300000)return cached.markets;
  if(requests.has(key))return requests.get(key)!;
  const task=(async()=>{
    const url=new URL('/events',BASE);
    url.searchParams.set('active','true');url.searchParams.set('closed','false');url.searchParams.set('limit','100');url.searchParams.set('order',key==='new'?'id':'volume24hr');url.searchParams.set('ascending','false');
    if(tagIds[key]){url.searchParams.set('tag_id',String(tagIds[key]));url.searchParams.set('related_tags','true');}
    const response=await fetch(url);if(!response.ok)throw Error('Feed unavailable');
    const events:RawEvent[]=await response.json();
    const unique=new Map<string,Market>();
    for(const event of events)for(const raw of event.markets||[]){if(raw.active===false||raw.closed===true)continue;const row=normalize({...event,markets:[raw]});if(row)unique.set(row.id,{...row,category:tags[key]?key[0].toUpperCase()+key.slice(1):row.category});}
    const rows=[...unique.values()];memory.set(key,{at:Date.now(),markets:rows});return rows;
  })();requests.set(key,task);try{return await task;}finally{requests.delete(key);}
}
export function useMarkets(section='trending') {
  const [markets,setMarkets]=useState<Market[]>(()=>memory.get(section)?.markets||[]);
  const [status,setStatus]=useState<'loading'|'ready'|'error'>(markets.length?'ready':'loading');
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{let active=true;setMarkets(memory.get(section)?.markets||[]);setStatus('loading');catalog(section).then(rows=>{if(active){setMarkets(rows);setStatus('ready');}}).catch(()=>{if(active)setStatus('error');});return()=>{active=false;};},[section,attempt]);
  return {markets,status,retry:()=>setAttempt(x=>x+1)};
}

export function useMarket(id:string){
 const [market,setMarket]=useState<Market|undefined>(()=>[...memory.values()].flatMap(x=>x.markets).find(x=>x.id===id));
 const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
 useEffect(()=>{let active=true;const known=[...memory.values()].flatMap(x=>x.markets).find(x=>x.id===id);setMarket(known);if(known){setStatus('ready');return;}setStatus('loading');fetch(`${BASE}/markets/${encodeURIComponent(id)}`).then(async r=>{if(!r.ok)throw Error();return r.json();}).then(raw=>{const row=normalize({id:raw.id,title:raw.question,image:raw.image,markets:[raw]});if(!row)throw Error();if(active){setMarket(row);setStatus('ready');}}).catch(()=>{if(active)setStatus('error');});return()=>{active=false;};},[id]);return {market,status};
}
