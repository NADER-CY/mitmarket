import { useEffect, useState } from 'react';

const BASE='https://external-api.kalshi.com/trade-api/v2';
type Series={ticker:string;title?:string;category?:string;categories?:string[];tags?:string[]};
type RawKalshiMarket={ticker:string;title?:string;subtitle?:string;yes_ask_dollars?:string;no_ask_dollars?:string;yes_bid_dollars?:string;last_price_dollars?:string;volume_24h_fp?:string;volume_fp?:string;status?:string;expiration_time?:string;close_time?:string};
type RawKalshiEvent={event_ticker:string;title?:string;series_ticker?:string;markets?:RawKalshiMarket[]};
export type KalshiCryptoMarket={id:string;eventTitle:string;title:string;series:string;yes:number|null;no:number|null;volume:number;endDate?:string;url:string};

async function fetchJson<T>(url:string,signal:AbortSignal):Promise<T>{const r=await fetch(url,{signal,headers:{Accept:'application/json'}});if(!r.ok)throw new Error(`Kalshi HTTP ${r.status}`);return r.json() as Promise<T>;}
function number(value?:string){const n=Number(value);return value!==undefined&&value!==''&&Number.isFinite(n)?n:null;}
export function useKalshiCrypto(enabled=true){
  const [markets,setMarkets]=useState<KalshiCryptoMarket[]>([]);
  const [status,setStatus]=useState<'loading'|'live'|'error'>('loading');
  const [error,setError]=useState('');
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    if(!enabled){setMarkets([]);setStatus('live');return;}
    const controller=new AbortController();
    async function load(){
      setStatus('loading');setError('');
      try{
        const seriesData=await fetchJson<{series?:Series[]}>(`${BASE}/series?category=Crypto`,controller.signal);
        const allSeries=(seriesData.series||[]).filter(x=>x.ticker);
        const matching=allSeries.filter(x=>/btc|bitcoin|eth|ethereum|sol|solana|xrp|doge|bnb|hype|hyperliquid|near|zec|zcash|ltc|litecoin|ada|cardano|link|chainlink|avax|trx|tron|polkadot|bch|stellar|cosmos|uniswap|aave/i.test(`${x.ticker} ${x.title||''} ${(x.tags||[]).join(' ')}`));
        const series=(matching.length?matching:allSeries).slice(0,28);
        const found:KalshiCryptoMarket[]=[];
        // Limit parallelism to protect the provider and handle empty/new series gracefully.
        for(let i=0;i<series.length;i+=5){
          const group=await Promise.allSettled(series.slice(i,i+5).map(async item=>{
            const url=new URL(`${BASE}/events`);url.searchParams.set('series_ticker',item.ticker);url.searchParams.set('status','open');url.searchParams.set('with_nested_markets','true');url.searchParams.set('limit','100');
            const data=await fetchJson<{events?:RawKalshiEvent[]}>(url.toString(),controller.signal);
            return (data.events||[]).flatMap(event=>(event.markets||[]).filter(m=>m.status==='active'||m.status==='open'||!m.status).map(m=>{
              const yes=number(m.yes_ask_dollars)??number(m.last_price_dollars)??number(m.yes_bid_dollars);
              return {id:m.ticker,eventTitle:event.title||item.title||'Crypto market',title:m.title||event.title||item.title||m.ticker,series:item.ticker,yes,no:number(m.no_ask_dollars),volume:Number(m.volume_24h_fp??m.volume_fp??0),endDate:m.expiration_time??m.close_time,url:`https://kalshi.com/markets/${encodeURIComponent(item.ticker.toLowerCase())}`};
            }));
          }));
          for(const result of group)if(result.status==='fulfilled')found.push(...result.value);
          if(controller.signal.aborted)return;
          setMarkets([...new Map(found.map(m=>[m.id,m])).values()].sort((a,b)=>b.volume-a.volume));
        }
        if(!controller.signal.aborted){setMarkets([...new Map(found.map(m=>[m.id,m])).values()].sort((a,b)=>b.volume-a.volume));setStatus('live');}
      }catch(e){if(!controller.signal.aborted){setStatus('error');setError(e instanceof Error?e.message:'Kalshi feed unavailable');}}
    }
    void load();return()=>controller.abort();
  },[refresh,enabled]);
  return {markets,status,error,reload:()=>setRefresh(i=>i+1)};
}
