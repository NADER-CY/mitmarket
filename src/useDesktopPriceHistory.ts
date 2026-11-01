import {useEffect,useState} from 'react';
import {cachedDesktopHistory,readDesktopHistory} from './desktopHistory';
type PricePoint={t:number;p:number};
export function useDesktopPriceHistory(url:string,refreshEvery=0){
 const cached=readDesktopHistory(url);
 const [revision,setRevision]=useState(0);
 const [snapshot,setSnapshot]=useState<{url:string;points:PricePoint[];status:'idle'|'loading'|'ready'|'unavailable'|'error'}>(()=>({url,points:cached?.data.history||[],status:url?'loading':'idle'}));
 useEffect(()=>{
  if(!url){setSnapshot({url,points:[],status:'idle'});return;}
  const controller=new AbortController(),previous=readDesktopHistory(url);
  setSnapshot({url,points:previous?.data.history||[],status:'loading'});
  const load=(force:boolean)=>cachedDesktopHistory(url,controller.signal,force).then(body=>{if(!controller.signal.aborted)setSnapshot({url,points:body.history,status:body.history.length>=2?'ready':'unavailable'});}).catch(()=>{if(!controller.signal.aborted)setSnapshot(old=>({url,points:old.url===url?old.points:[],status:'error'}));});
  void load(revision>0);
  const timer=refreshEvery?window.setInterval(()=>{if(document.visibilityState==='visible')void load(true);},refreshEvery):undefined;
  return()=>{controller.abort();if(timer!==undefined)window.clearInterval(timer);};
 },[url,revision,refreshEvery]);
 const current=snapshot.url===url?snapshot:{url,points:cached?.data.history||[],status:url?'loading' as const:'idle' as const};
 return {...current,retry:()=>setRevision(value=>value+1)};
}
