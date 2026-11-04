import {useMemo,useState} from 'react';
import {useCryptoBook} from './useCryptoBook';
import css from './cryptoOrderBook.css?inline';
const format=(n:number)=>Number.isFinite(n)?n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';
const cent=(n:number)=>Number.isFinite(n)?`${Math.round(n*100)}¢`:'—';
export function CryptoOrderBook({tokens,volume}:{tokens:string[];volume:number}){
 const [open,setOpen]=useState(false),[side,setSide]=useState(0);const {book,status}=useCryptoBook(open?tokens[side]:undefined);
 const bids=useMemo(()=>[...(book?.bids||[])].sort((a,b)=>+b.price-+a.price).slice(0,4),[book]);
 const asks=useMemo(()=>[...(book?.asks||[])].sort((a,b)=>+a.price-+b.price).slice(0,4).reverse(),[book]);
 const bestBid=Number(bids[0]?.price),bestAsk=Number(asks.at(-1)?.price),spread=Number.isFinite(bestBid)&&Number.isFinite(bestAsk)?bestAsk-bestBid:NaN;
 const largest=Math.max(1,...asks.map(x=>+x.size),...bids.map(x=>+x.size));
 const rows=(levels:{price:string;size:string}[],kind:'ask'|'bid')=>levels.map((level,i)=>{const price=+level.price,size=+level.size;return <div className={`pm-ob-row ${kind}`} key={`${kind}-${level.price}-${i}`}><span className="pm-ob-depth" style={{width:`${Math.min(100,size/largest*45)}%`}}/><span className="pm-ob-price">{cent(price)}</span><span>{format(size)}</span><span>${format(price*size)}</span></div>});
 return <section className={`pm-ob ${open?'expanded':''}`}><style>{css}</style><button className="pm-ob-toggle" onClick={()=>setOpen(v=>!v)} aria-expanded={open}><strong>Order Book <small>ⓘ</small></strong><span>{volume>0?`$${volume>=1000?`${(volume/1000).toFixed(1)}K`:format(volume)}`:'$0'} Vol. &nbsp; {open?'⌃':'⌄'}</span></button>{open&&<div className="pm-ob-body"><div className="pm-ob-top"><div><button className={side===0?'active':''} onClick={()=>setSide(0)}>Trade Up</button><button className={side===1?'active':''} onClick={()=>setSide(1)}>Trade Down</button></div><span>Maker Rebate &nbsp; <b>＋ Rewards</b></span></div><div className="pm-ob-headers"><span>TRADE {side===0?'UP':'DOWN'}</span><span>PRICE</span><span>SHARES</span><span>TOTAL</span></div><div className="pm-ob-depth-block">{rows(asks,'ask')}<span className="pm-ob-badge ask">Asks</span></div><div className="pm-ob-mid"><span>Last: {cent(+(book?.last_trade_price||'NaN'))}</span><span>Spread: {cent(spread)}</span></div><div className="pm-ob-depth-block">{rows(bids,'bid')}<span className="pm-ob-badge bid">Bids</span></div>{!asks.length&&!bids.length&&<p className="pm-ob-empty">{status==='connecting'?'Loading order book…':'No available orders for this market.'}</p>}</div>}</section>;
}
