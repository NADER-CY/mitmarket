import {useEffect,useMemo,useState} from 'react';
import type {Market} from './live';
import css from './cryptoMarketTimeline.css?inline';

type EventRow={id?:string;closed?:boolean;markets?:Array<{id?:string;closed?:boolean;outcomes?:string|string[];outcomePrices?:string|string[]}>};
type SlotResult={marketId?:string;winner?:'up'|'down'};
const resolved=new Map<string,SlotResult>();
const shortCodes:[RegExp,string][]=[[/bitcoin|\bbtc\b/i,'btc'],[/ethereum|\beth\b/i,'eth'],[/solana|\bsol\b/i,'sol'],[/xrp/i,'xrp'],[/bnb/i,'bnb'],[/dogecoin|doge/i,'doge'],[/hyperliquid|hype/i,'hype']];
const parseArr=(v:string|string[]|undefined)=>{if(Array.isArray(v))return v;if(!v)return [];try{const d:unknown=JSON.parse(v);return Array.isArray(d)?d.map(String):[]}catch{return []}};
function nyDay(t:number){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(t)}
function clock(t:number){return new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit',hour12:true}).format(t)}
function label(t:number){return new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit',hour12:true}).format(t).replace(/\s/g,'')}

export function CryptoMarketTimeline({market,title,onMarket}:{market?:Market;title:string;onMarket:(id:string)=>void}){
 const [now,setNow]=useState(Date.now()),[pastOpen,setPastOpen]=useState(false),[moreOpen,setMoreOpen]=useState(false),[outcomes,setOutcomes]=useState<Record<number,SlotResult>>({}),[loading,setLoading]=useState<number|null>(null);
 useEffect(()=>{let offsetMs=0,disposed=false;const tick=()=>setNow(Date.now()+offsetMs);const synchronize=async()=>{const sent=Date.now();try{const res=await fetch(`${location.origin}/`,{method:'HEAD',cache:'no-store'});const stamp=res.headers.get('Date');if(!stamp)return;const server=Date.parse(stamp);if(Number.isFinite(server)&&!disposed){offsetMs=server-(sent+Date.now())/2;tick()}}catch{/* Use device clock if server clock is unreachable. */}};
  const timer=window.setInterval(tick,1000),syncTimer=window.setInterval(()=>void synchronize(),60000);const visible=()=>{tick();if(document.visibilityState==='visible')void synchronize()};document.addEventListener('visibilitychange',visible);void synchronize();return()=>{disposed=true;clearInterval(timer);clearInterval(syncTimer);document.removeEventListener('visibilitychange',visible)}},[]);
 const slug=market?.eventSlug||'';const slugMatch=slug.match(/^([a-z]+)-updown-(5m|15m)-\d+$/);
 const coin=slugMatch?.[1]||shortCodes.find(([r])=>r.test(title))?.[1]||'btc';
 const duration=slugMatch?.[2]==='5m'||(/(?:\b5m\b|\b5 min\b)/i.test(title)&&!/(?:15m|15 min)/i.test(title))?5:15;
 const durationMs=duration*60000;
 const currentStart=Math.floor(now/durationMs)*durationMs;
 const previous=useMemo(()=>Array.from({length:8},(_,i)=>currentStart-(i+1)*durationMs).filter(t=>nyDay(t)===nyDay(now)),[currentStart,durationMs,now]);
 const next=useMemo(()=>[-1,0,1,2].map(i=>currentStart+i*durationMs),[currentStart,durationMs]);
 const slugFor=(t:number)=>`${coin}-updown-${duration}m-${Math.floor(t/1000)}`;
 async function lookup(t:number):Promise<SlotResult>{const slugKey=slugFor(t);const prior=resolved.get(slugKey);if(prior)return prior;
  try{const response=await fetch(`https://gamma-api.polymarket.com/events?slug=${encodeURIComponent(slugKey)}&limit=1`);if(!response.ok)return {};const data:unknown=await response.json();const event=(Array.isArray(data)?data[0]:undefined) as EventRow|undefined;const m=event?.markets?.[0];if(!m?.id)return {};const prices=parseArr(m.outcomePrices).map(Number),names=parseArr(m.outcomes);const winnerIndex=prices.findIndex(p=>Number.isFinite(p)&&p>=.999);const winner=event?.closed===true&&winnerIndex>=0?(/down|no/i.test(names[winnerIndex])?'down':'up'):undefined;const result={marketId:String(m.id),winner} as SlotResult;resolved.set(slugKey,result);return result}catch{return {}}}
 async function enter(t:number){setLoading(t);const found=await lookup(t);setLoading(null);if(found.marketId)onMarket(found.marketId)}
 useEffect(()=>{if(!pastOpen)return;let active=true;let index=0;const fetchNext=async()=>{while(index<previous.length&&active){const t=previous[index++];const data=await lookup(t);if(active)setOutcomes(old=>({...old,[t]:data}))}};void Promise.all([fetchNext(),fetchNext(),fetchNext()]);return()=>{active=false}},[pastOpen,currentStart,coin,duration]);
 const dot=(t:number)=>{const winner=outcomes[t]?.winner;return winner==='up'?'up':winner==='down'?'down':'unknown'};
 return <div className="pm-timeline"><style>{css}</style><div className="pm-timeline-past"><button className={`pm-timeline-past-button ${pastOpen?'open':''}`} aria-expanded={pastOpen} onClick={()=>setPastOpen(v=>!v)}>Past <span>{pastOpen?'⌃':'⌄'}</span></button>{pastOpen&&<div className="pm-timeline-dropdown">{previous.map(t=><button key={t} onClick={()=>void enter(t)}><span className={`pm-result-dot ${dot(t)}`}>{dot(t)==='up'?'▲':dot(t)==='down'?'▼':'·'}</span><strong>{clock(t)} ET</strong><span className="pm-timeline-today">· Today</span></button>)}{!previous.length&&<p>No earlier markets today</p>}</div>}</div><div className="pm-timeline-results">{previous.slice(0,4).reverse().map(t=><button key={t} title={`${clock(t)} ET · completed`} onClick={()=>void enter(t)} className={`pm-result-dot ${dot(t)}`}>{dot(t)==='up'?'▲':dot(t)==='down'?'▼':'·'}</button>)}</div><div className="pm-timeline-slots">{next.map(t=><button key={t} onClick={()=>void enter(t)} className={`pm-timeline-slot ${t===currentStart?'current':''} ${loading===t?'loading':''}`} title={t<currentStart?'Finished':t===currentStart?'Live now':'Upcoming'}>{t===currentStart&&<i/>}{label(t)}</button>)}<div className="pm-timeline-more"><button onClick={()=>setMoreOpen(v=>!v)}>More ⌄</button>{moreOpen&&<div className="pm-timeline-extra">{[3,4,5,6].map(i=><button key={i} onClick={()=>void enter(currentStart+i*durationMs)}>{label(currentStart+i*durationMs)}</button>)}</div>}</div></div></div>
}
