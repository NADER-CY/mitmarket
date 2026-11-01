type Listener=()=>void;
export function createQuoteStore(){const quotes=new Map<string,number>(),versions=new Map<string,number>(),listeners=new Map<string,Set<Listener>>();let sequence=0;return{
 get:(id:string)=>quotes.get(id),
 revision:(ids:string[])=>ids.reduce((max,id)=>Math.max(max,versions.get(id)||0),0),
 subscribe(ids:string[],listener:Listener){for(const id of ids){const set=listeners.get(id)||new Set<Listener>();set.add(listener);listeners.set(id,set);}return()=>{for(const id of ids){const set=listeners.get(id);set?.delete(listener);if(!set?.size)listeners.delete(id);}};},
 publish(values:Map<string,number>){const notify=new Set<Listener>();for(const [id,value] of values){if(!Number.isFinite(value)||value<0||value>1||quotes.get(id)===value)continue;quotes.set(id,value);versions.set(id,++sequence);for(const listener of listeners.get(id)||[])notify.add(listener);}for(const listener of notify)listener();},
};}
export const liveQuotes=createQuoteStore();
