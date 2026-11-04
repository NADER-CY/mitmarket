import {useEffect,useMemo,useState} from 'react';
import type {Market} from './live';
import type {Language} from './i18n';
import {MarketComments} from './MarketComments';
import {useCryptoBook} from './useCryptoBook';
import {CryptoSpotChart} from './CryptoSpotChart';
import {PackedHistory} from './PackedHero';
import styles from './cryptoMarketDetailV2.css?inline';

type Detail={description?:string;resolutionSource?:string;closed?:boolean;active?:boolean;image?:string;question?:string;clobTokenIds?:string|string[];outcomes?:string|string[];outcomePrices?:string|string[];endDate?:string;events?:{id?:string;title?:string}[]};
const array=(v:string|string[]|undefined):string[]=>{if(Array.isArray(v))return v;if(!v)return [];try{const a:unknown=JSON.parse(v);return Array.isArray(a)?a.map(String):[]}catch{return []}};
const numeric=(n:number|undefined)=>n!==undefined&&Number.isFinite(n);
const usd=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(n);
const cents=(n:number|undefined)=>numeric(n)?`${(n!*100).toFixed(1)}¢`:'—';
const number=(n:number)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n);

function TradeTicket({prices,outcomes,closed}:{prices:number[];outcomes:string[];closed:boolean}){
 const [mode,setMode]=useState<'buy'|'sell'>('buy'),[side,setSide]=useState(0),[amount,setAmount]=useState('10');
 const price=prices[side],total=Number(amount),valid=Number.isFinite(total)&&total>0&&Number.isFinite(price)&&price>0&&price<1;
 const shares=valid?total/price:0,possibleReturn=valid?shares-total:0;
 return <section className="cmt-ticket" aria-label="Market trading ticket">
  <div className="cmt-ticket-switch"><button onClick={()=>setMode('buy')} className={mode==='buy'?'active':''}>Buy</button><button onClick={()=>setMode('sell')} className={mode==='sell'?'active':''}>Sell</button><span className="cmt-ticket-currency">USDT</span></div>
  <div className="cmt-ticket-outcomes">{outcomes.slice(0,2).map((o,i)=><button key={o} onClick={()=>setSide(i)} className={`${side===i?'active ':''}${i?'down':'up'}`}><span>{o}</span><strong>{cents(prices[i])}</strong></button>)}</div>
  <div className="cmt-input-caption"><span>Amount</span><span>USDT</span></div>
  <div className="cmt-amount"><span>$</span><input inputMode="decimal" aria-label="Trade amount in USDT" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0"/><div className="cmt-presets">{[5,10,25].map(n=><button key={n} onClick={()=>setAmount(String(n))}>${n}</button>)}</div></div>
  <div className="cmt-estimate"><div><span>Est. shares</span><b>{valid?number(shares):'—'}</b></div><div><span>{mode==='buy'?'Potential profit':'Estimated proceeds'}</span><b>{valid?usd(mode==='buy'?possibleReturn:total):'—'}</b></div><div><span>Price / share</span><b>{cents(price)}</b></div></div>
  <button className="cmt-submit" disabled>{closed?'Market closed':`${mode==='buy'?'Buy':'Sell'} ${outcomes[side]||'outcome'} · Connect account`}</button>
  <p className="cmt-disclaimer">Preview only · Orders and account balances are not connected. No trades will be submitted.</p>
 </section>;
}

export function CryptoMarketDetail({id,market,language,onMarket,onBack,related}:{id:string;market?:Market;language:Language;onMarket:(id:string)=>void;onBack:()=>void;related:Market[]}){
 const [detail,setDetail]=useState<Detail|null>(null),[fetchError,setFetchError]=useState(false),[chartMode,setChartMode]=useState<'spot'|'market'>('spot'),[side,setSide]=useState(0);
 useEffect(()=>{const controller=new AbortController();setDetail(null);setFetchError(false);void fetch(`https://gamma-api.polymarket.com/markets/${encodeURIComponent(id)}`,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error(String(r.status));return r.json() as Promise<Detail>}).then(d=>{if(!controller.signal.aborted)setDetail(d)}).catch(()=>{if(!controller.signal.aborted)setFetchError(true)});return()=>controller.abort();},[id]);
 const tokens=array(detail?.clobTokenIds).length?array(detail?.clobTokenIds):market?.tokenIds||[];
 const outcomes=array(detail?.outcomes).length?array(detail?.outcomes):market?.outcomes||['Up','Down'];
 const prices=market?.prices?.length?market.prices:array(detail?.outcomePrices).map(Number);
 const name=detail?.question||market?.title||(fetchError?'Market temporarily unavailable':'Loading market…');
 const eventName=market?.eventTitle||detail?.events?.[0]?.title||name;
 const image=detail?.image||market?.image;
 const closesAt=detail?.endDate||market?.endDate;
 const closed=detail?.closed===true||(closesAt?Date.parse(closesAt)<Date.now():false);
 const {book,status,updated}=useCryptoBook(tokens[side]);
 const asks=useMemo(()=>[...(book?.asks||[])].sort((a,b)=>+a.price-+b.price).slice(0,6).reverse(),[book]);
 const bids=useMemo(()=>[...(book?.bids||[])].sort((a,b)=>+b.price-+a.price).slice(0,6),[book]);
 const siblingMarkets=useMemo(()=>related.filter(row=>row.id!==id&&/up or down/i.test(row.title)).slice(0,8),[related,id]);
 const commentMarket:Market|undefined=market||(detail?.events?.[0]?.id?{id,eventId:String(detail.events[0].id),title:name,eventTitle:eventName,category:'Crypto',tokenIds:tokens,outcomes,prices,volume24h:0,volumeTotal:0,liquidity:0,startTime:0}:undefined);
 return <div className="cmt-page"><style>{styles}</style><div className="cmt-wrap">
  <button className="cmt-back" onClick={onBack}>‹ All Crypto markets</button>
  <div className="cmt-layout"><main className="cmt-main">
   <header className="cmt-title"><div className="cmt-coin">{image?<img src={image} alt=""/>:<span>₿</span>}</div><div className="cmt-heading"><div className="cmt-eyebrow">CRYPTO · PREDICTION MARKET</div><h1>{name}</h1><span>{closesAt?`Resolves ${new Date(closesAt).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}`:'Live market'}</span></div><span className={`cmt-status ${closed?'ended':''}`}>{closed?'CLOSED':'● LIVE MARKET'}</span></header>
   <div className="cmt-pricing"><div><small>Price to beat</small><strong>—</strong><span>Provider target unavailable</span></div><div><small>Market probability</small><strong>{cents(prices[0])}</strong><span>{outcomes[0]||'Up'}</span></div><div><small>24h volume</small><strong>{market?usd(market.volume24h):'—'}</strong><span>Verified market feed</span></div></div>
   <div className="cmt-chart-top"><div className="cmt-tabs"><button className={chartMode==='spot'?'active':''} onClick={()=>setChartMode('spot')}>Asset price</button><button className={chartMode==='market'?'active':''} onClick={()=>setChartMode('market')}>Market odds</button></div><span>LIVE CHART · {chartMode==='spot'?'SPOT PRICE':'PREDICTION PROBABILITY'}</span></div>
   <div className="cmt-chart-area">{chartMode==='spot'?<CryptoSpotChart title={name}/>:<PackedHistory market={market} onChange={()=>{}}/>}</div>
   <div className="cmt-window-nav"><span>OTHER CRYPTO MARKETS</span><div>{siblingMarkets.slice(0,5).map(s=><button key={s.id} onClick={()=>onMarket(s.id)} title={s.title}>{s.title.replace(/ - .*$/,'').slice(0,26)} ↗</button>)}{!siblingMarkets.length&&<small>Related markets will appear when available.</small>}</div></div>
   <section className="cmt-orderbook"><header><h2>Order Book</h2><span>{status==='live'?'● Live':status==='connected'?'Connected':status==='reconnecting'?'Reconnecting…':'Awaiting market data'}{updated?` · ${new Date(updated).toLocaleTimeString('en-US')}`:''}</span></header><div className="cmt-book-tabs">{outcomes.slice(0,2).map((o,i)=><button key={o} onClick={()=>setSide(i)} className={side===i?'active':''}>{o} order book</button>)}</div><div className="cmt-book-cols"><span>PRICE</span><span>SHARES</span><span>TOTAL</span></div>{asks.map((row,i)=><div className="cmt-book-line ask" key={`ask${i}`}><span>{cents(+row.price)}</span><span>{number(+row.size)}</span><span>{usd(+row.price*+row.size)}</span></div>)}<div className="cmt-book-mid"><span>Last traded</span><strong>{book?.last_trade_price?cents(+book.last_trade_price):'—'}</strong></div>{bids.map((row,i)=><div className="cmt-book-line bid" key={`bid${i}`}><span>{cents(+row.price)}</span><span>{number(+row.size)}</span><span>{usd(+row.price*+row.size)}</span></div>)}{!asks.length&&!bids.length&&<div className="cmt-book-empty">No active orders in this market.</div>}</section>
   <section className="cmt-rules"><h2>Rules</h2><p>{detail?.description||'Market resolution rules are loading or unavailable.'}</p>{detail?.resolutionSource&&<p>Resolution source: {detail.resolutionSource}</p>}</section>
   {commentMarket&&<MarketComments market={commentMarket} language={language}/>}
  </main><aside className="cmt-sidebar"><TradeTicket key={id} outcomes={outcomes} prices={prices} closed={closed}/><div className="cmt-related"><h3>More Crypto markets</h3>{related.filter(row=>row.id!==id).slice(0,6).map(row=><button key={row.id} onClick={()=>onMarket(row.id)}>{row.image&&<img src={row.image} alt=""/>}<span>{row.title}</span><strong>{cents(row.prices[0])}</strong></button>)}</div></aside></div>
 </div></div>;
}
