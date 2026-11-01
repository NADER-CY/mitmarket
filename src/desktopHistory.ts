import {cachedHistory} from './historyCache';
/** Share identical desktop chart reads and avoid a burst of parallel requests. */
export function createReadPool(limit=4){
 let active=0;const queue:(()=>void)[]=[];const pending=new Map<string,Promise<unknown>>();
 const drain=()=>{while(active<limit&&queue.length){active++;queue.shift()!();}};
 return function read<T>(key:string,load:()=>Promise<T>):Promise<T>{
  const existing=pending.get(key);if(existing)return existing as Promise<T>;
  const result=new Promise<T>((resolve,reject)=>{queue.push(()=>{Promise.resolve().then(load).then(resolve,reject).finally(()=>{active--;pending.delete(key);drain();});});});
  pending.set(key,result);drain();return result;
 };
}
export type HistoryPayload={history:{t:number;p:number}[]};
export type HistorySnapshot={time:number;data:HistoryPayload};
const historyMemory=new Map<string,HistorySnapshot>();
const prefix='mit-desktop-history:v1:';
const freshFor=5*60*1000,retainFor=24*60*60*1000;
export function readDesktopHistory(url:string):HistorySnapshot|null{
 if(!url)return null;
 let value=historyMemory.get(url);
 if(!value){try{const raw=localStorage.getItem(prefix+url)||sessionStorage.getItem('mit-history:'+url);if(raw)value=JSON.parse(raw) as HistorySnapshot;}catch{/* Storage is optional. */}}
 if(!value||!Number.isFinite(value.time)||Date.now()-value.time>retainFor||!Array.isArray(value.data?.history))return null;
 if(!historyMemory.has(url))value={time:value.time,data:{history:value.data.history.filter(p=>Number.isFinite(p.t)&&Number.isFinite(p.p)&&p.p>=0&&p.p<=1).sort((a,b)=>a.t-b.t)}};
 historyMemory.set(url,value);return value;
}
export function writeDesktopHistory(url:string,body:{history?:{t:number;p:number}[]},time=Date.now()){
 const history=(body.history||[]).filter(p=>Number.isFinite(p.t)&&Number.isFinite(p.p)&&p.p>=0&&p.p<=1).sort((a,b)=>a.t-b.t);
 const value={time,data:{history}};historyMemory.set(url,value);
 if(historyMemory.size>96)historyMemory.delete(historyMemory.keys().next().value!);
 try{localStorage.setItem(prefix+url,JSON.stringify(value));const indexKey=prefix+'index';const index=JSON.parse(localStorage.getItem(indexKey)||'[]') as string[];const keys=[...index.filter(key=>key!==url),url];while(keys.length>64)localStorage.removeItem(prefix+keys.shift()!);localStorage.setItem(indexKey,JSON.stringify(keys));}catch{/* Charts also retain their in-memory snapshot. */}
 return value;
}
const read=createReadPool(4);
export function cachedDesktopHistory(url:string,signal:AbortSignal,force=false):Promise<HistoryPayload>{
 if(signal.aborted)return Promise.reject(new DOMException('Aborted','AbortError'));
 const cached=readDesktopHistory(url);
 if(!force&&cached&&Date.now()-cached.time<(cached.data.history.length>=2?freshFor:60000))return Promise.resolve(cached.data);
 const queuedAt=Date.now();
 const request=read(url,async()=>{
  if(Date.now()-queuedAt>20000)throw Error('History queue timed out');
  try{
   let body:{history?:{t:number;p:number}[]};
   if(force){const response=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('History unavailable');body=await response.json() as HistoryPayload;if(!Array.isArray(body.history))throw Error('Invalid history');}
   else body=await cachedHistory(url,AbortSignal.timeout(15000));
   if((body.history?.length||0)<2&&cached&&cached.data.history.length>=2)return cached.data;
   return writeDesktopHistory(url,body).data;
  }catch(error){if(cached&&cached.data.history.length>=2)return cached.data;throw error;}
 });
 let timer:ReturnType<typeof setTimeout>;
 const deadline=new Promise<HistoryPayload>((_,reject)=>{timer=setTimeout(()=>reject(Error('History request timed out')),20000);});
 return Promise.race([request,deadline]).finally(()=>clearTimeout(timer));
}
