import {useEffect,useMemo,useState} from 'react';
import type {Market} from './live';
import type {Language} from './i18n';
import {CryptoSpotChart} from './CryptoSpotChart';
import {MarketComments} from './MarketComments';
import {CryptoMarketTimeline} from './CryptoMarketTimeline';
import {CryptoOrderBook} from './CryptoOrderBook';
import css from './cryptoMarketDetailV3.css?inline';

type Detail={question?:string;image?:string;description?:string;resolutionSource?:string;endDate?:string;closed?:boolean;clobTokenIds?:string|string[];outcomes?:string|string[];outcomePrices?:string|string[];events?:{id?:string;title?:string}[]};
const arr=(v:string|string[]|undefined):string[]=>{if(Array.isArray(v))return v;if(!v)return [];try{const x:unknown=JSON.parse(v);return Array.isArray(x)?x.map(String):[]}catch{return []}};
const cents=(v:number|undefined)=>Number.isFinite(v)?`${Math.round(v!*100)}¢`:'—';
const money=(v:number)=>`$${v.toLocaleString('en-US',{maximumFractionDigits:2})}`;
const assetIcon=(title:string)=>/btc|bitcoin/i.test(title)?'₿':/eth|ethereum/i.test(title)?'◆':/sol|solana/i.test(title)?'≋':/bnb/i.test(title)?'⬡':'◈';
const coinColor=(title:string)=>/btc|bitcoin/i.test(title)?'#f7931a':/eth|ethereum/i.test(title)?'#6778d8':/sol|solana/i.test(title)?'#101820':'#318cf5';
const label=(title:string)=>{const m=title.match(/^(.*?)(?:\s+-\s+|\s*\(|$)/);return m?.[1]?.trim()||title};
type Period='5 Min'|'15 Min'|'1 Hour'|'1 Day';
function marketPeriod(m:Pick<Market,'title'|'eventSlug'|'eventTitle'>):Period|null{
 const slug=m.eventSlug||'',text=[slug,m.title,m.eventTitle].join(' ');
 if(/(?:updown[-_]?5m|\b5\s*(?:min|minute)s?\b)/i.test(text))return '5 Min';
 if(/(?:updown[-_]?15m|\b15\s*(?:min|minute)s?\b)/i.test(text))return '15 Min';
 if(/(?:updown[-_]?1h|\b1\s*(?:hour|hr)\b|hourly)/i.test(text))return '1 Hour';
 if(/(?:updown[-_]?1d|\b1\s*day\b|daily|up or down on [a-z]+\s+\d+)/i.test(text))return '1 Day';
 const range=text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
 if(range){const a=(Number(range[1])%12+(range[3].toUpperCase()==='PM'?12:0))*60+Number(range[2]),b=(Number(range[4])%12+(range[6].toUpperCase()==='PM'?12:0))*60+Number(range[5]);const minutes=(b-a+1440)%1440;return minutes===5?'5 Min':minutes===15?'15 Min':minutes===60?'1 Hour':null}
 return null;
}

function Ticket({title,image,prices,outcomes,closed}:{title:string;image?:string;prices:number[];outcomes:string[];closed:boolean}){
 const [trade,setTrade]=useState<'buy'|'sell'>('buy'),[side,setSide]=useState(0),[quick,setQuick]=useState(true),[amount,setAmount]=useState(25);
 const price=prices[side],payout=Number.isFinite(price)&&price>0?amount/price:0;
 return <div className="pm-ticket"><div className="pm-ticket-heading"><div className="pm-icon small" style={{background:coinColor(title)}}>{image?<img src={image} alt=""/>:assetIcon(title)}</div><div><div>{label(title)}</div><strong style={{color:side?'#e3404a':'#009c51'}}>{outcomes[side]||'Up'}</strong></div></div>
 <div className="pm-trade-tabs"><button className={trade==='buy'?'selected':''} onClick={()=>setTrade('buy')}>Buy</button><button className={trade==='sell'?'selected':''} onClick={()=>setTrade('sell')}>Sell</button><button className="pm-trade-mode" onClick={()=>setQuick(v=>!v)}>{quick?'1-Tap':'Amount'}⌄</button></div>
 <div className="pm-trade-sides">{outcomes.slice(0,2).map((o,i)=><button key={i} className={`${i===side?'selected':''} ${i===0?'up':'down'}`} onClick={()=>setSide(i)}>{o} {cents(prices[i])}</button>)}</div>
 {quick?<><h4>One-tap {trade}</h4><div className="pm-quick">{[5,25,100].map(n=><button className={n===amount?'chosen':''} key={n} onClick={()=>setAmount(n)}><b>{money(n)}</b><span>win <em>{payout&&price>0?money(n/price-n):'—'}</em></span></button>)}</div></>:<><div className="pm-amount-title">Amount <span>USDT</span></div><div className="pm-amount"><span>$</span><input type="number" min="1" value={amount} onChange={e=>setAmount(Math.max(0,+e.target.value))}/></div><div className="pm-estimate">Estimated shares <b>{payout?payout.toFixed(2):'—'}</b></div></>}
 <button className="pm-order-disabled" disabled>{closed?'Market closed':`${trade==='buy'?'Buy':'Sell'} · Connect account`}</button><p className="pm-trade-notice">Preview only. Trading is not connected.</p></div>;
}

function OutcomeCard({title,outcome,confirmed}:{title:string;outcome?:string;confirmed:boolean}){
 return <section className={`pm-outcome ${confirmed?'confirmed':'pending'}`} aria-label="Completed market outcome"><div className="pm-outcome-symbol">{confirmed?'✓':'⌛'}</div><h2>{confirmed?`Outcome: ${outcome}`:'Outcome: Pending'}</h2><p>{title}</p>{!confirmed&&<small>Awaiting verified settlement result</small>}</section>;
}

export function CryptoMarketDetail({id,market,language,onMarket,onBack,related}:{id:string;market?:Market;language:Language;onMarket:(id:string)=>void;onBack:()=>void;related:Market[]}){
 const [detail,setDetail]=useState<Detail|null>(null),[tab,setTab]=useState<'rules'|'context'>('rules'),[info,setInfo]=useState<'comments'|'holders'|'positions'|'activity'>('comments'),[period,setPeriod]=useState('15 Min');
 useEffect(()=>{const c=new AbortController();setDetail(null);const load=()=>{void fetch(`https://gamma-api.polymarket.com/markets/${encodeURIComponent(id)}`,{signal:c.signal,cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(d=>{if(!c.signal.aborted)setDetail(d)}).catch(()=>{})};load();const timer=window.setInterval(load,15000);return()=>{clearInterval(timer);c.abort()}},[id]);
 const title=detail?.question||market?.title||'Crypto Up or Down';const image=detail?.image||market?.image;
 const outcomes=arr(detail?.outcomes).length?arr(detail?.outcomes):market?.outcomes||['Up','Down'];
 const prices=market?.prices?.length?market.prices:arr(detail?.outcomePrices).map(Number);
 const tokens=arr(detail?.clobTokenIds).length?arr(detail?.clobTokenIds):market?.tokenIds||[];
 // The provider, not the device clock, decides if a crypto prediction market is closed.
 // Gamma may keep a market tradable briefly around a scheduled boundary.
 const endDate=detail?.endDate||market?.endDate;const closed=detail?.closed===true;
 const winnerIndex=closed?prices.findIndex(p=>Number.isFinite(p)&&p>=.999):-1;
 const confirmedWinner=winnerIndex>=0?outcomes[winnerIndex]:undefined;
 const relatedMarkets=useMemo(()=>related.filter(m=>m.id!==id&&/up or down/i.test(m.title)),[id,related]);
 const periodMarkets=useMemo(()=>relatedMarkets.filter(m=>marketPeriod(m)===period).slice(0,12),[relatedMarkets,period]);
 useEffect(()=>{const selected=market?marketPeriod(market):marketPeriod({title,eventSlug:'',eventTitle:title});if(selected)setPeriod(selected)},[id,market?.eventSlug,title]);
 const commentMarket=market||(detail?.events?.[0]?.id?{id,eventId:String(detail.events[0].id),title,eventTitle:detail.events[0].title||title,category:'Crypto',tokenIds:tokens,outcomes,prices,volume24h:0,volumeTotal:0,liquidity:0,startTime:0} as Market:undefined);
 const start=endDate?new Date(Date.parse(endDate)-(/15m|15 min/i.test(title)?900000:300000)):null;
 const dateLabel=start&&!Number.isNaN(start.valueOf())?`${start.toLocaleString('en-US',{month:'long',day:'numeric',timeZone:'America/New_York'})}, ${start.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'})} ET`: 'Live crypto prediction market';
 return <div className="pm-page"><style>{css}</style><div className="pm-shell"><div className="pm-columns"><main className="pm-main">
  <header className="pm-event"><div className="pm-icon" style={{background:coinColor(title)}}>{image?<img src={image} alt=""/>:assetIcon(title)}</div><div className="pm-event-text"><h1>{label(title)}</h1><p>{dateLabel} <span title="This market resolves using the source specified in its rules">ⓘ</span></p></div><div className="pm-event-actions"><button title="Share market" onClick={()=>{if(navigator.clipboard)void navigator.clipboard.writeText(location.href)}}>↗</button><button title="Copy market link" onClick={()=>{if(navigator.clipboard)void navigator.clipboard.writeText(location.href)}}>♧</button><button title="Bookmark" onClick={e=>e.currentTarget.classList.toggle('active')}>♧</button></div></header>
  <div className="pm-price-head"><div><small>Price To Beat</small><strong>—</strong></div><div className="pm-timer">{closed?'Ended':<><strong>--</strong><span>MINS</span><strong>--</strong><span>SECS</span></>}<span className="pm-watermark">MITMARKET</span></div></div>
  <div className="pm-chart"><CryptoSpotChart key={id} title={title}/><div className="pm-target">Target</div></div>
  <div className="pm-chart-footer"><CryptoMarketTimeline market={market} title={title} onMarket={onMarket}/><div className="pm-chart-tools"><button title="Line chart">⌁</button><button className="active" title="Crypto price">₿</button><button title="Candles">▥</button></div></div>
  <CryptoOrderBook tokens={tokens} volume={market?.volume24h||0}/>
  <div className="pm-info-tabs"><button className={tab==='rules'?'active':''} onClick={()=>setTab('rules')}>Rules</button><button className={tab==='context'?'active':''} onClick={()=>setTab('context')}>Market Context</button></div><div className="pm-rules">{tab==='rules'?<><p>{detail?.description||'Market resolution information is loading. The outcome is determined according to the published market rules and resolution source.'}</p>{detail?.resolutionSource&&<p>Resolution Source: <a href={detail.resolutionSource} target="_blank" rel="noreferrer">{detail.resolutionSource}</a></p>}<p>Live data may be delayed by a few seconds and can be influenced by price activity on other exchanges and broader market conditions.</p></>:<p>Check the rules and resolution source for this prediction market. Displayed spot prices are indicative and may differ from the settlement feed.</p>}</div>
  <div className="pm-social-tabs">{(['comments','holders','positions','activity'] as const).map(t=><button key={t} className={info===t?'active':''} onClick={()=>setInfo(t)}>{t==='comments'?'Comments':t==='holders'?'Top Holders':t==='positions'?'Positions':'Activity'}</button>)}</div><div className="pm-social">{info==='comments'&&commentMarket?<MarketComments market={commentMarket} language={language}/>:<p>{info==='comments'?'Comments are unavailable.':info==='holders'?'Holder data is not available.':info==='positions'?'Connect an account to view positions.':'Recent activity is not available.'}</p>}</div>
 </main><aside className="pm-sidebar">{closed?<OutcomeCard title={title} outcome={confirmedWinner} confirmed={Boolean(confirmedWinner)}/>:<Ticket key={id} title={title} image={image} prices={prices} outcomes={outcomes} closed={closed}/>}<p className="pm-terms">By trading, you agree to the <u>Terms of Use</u>.</p><div className="pm-related-tabs">{(['5 Min','15 Min','1 Hour','1 Day'] as const).map(t=><button key={t} className={period===t?'active':''} onClick={()=>setPeriod(t)}>{t}</button>)}</div><div className="pm-related">{periodMarkets.map(m=><button key={m.id} onClick={()=>onMarket(m.id)}><span className="pm-icon mini" style={{background:coinColor(m.title)}}>{m.image?<img src={m.image} alt=""/>:assetIcon(m.title)}</span><span>{label(m.title)}</span><strong>{Number.isFinite(m.prices[0])?`${Math.round(m.prices[0]*100)}%`:'—'}<small>{m.outcomes[0]||'Up'}</small></strong></button>)}{periodMarkets.length===0&&<p className="pm-related-empty">No {period} markets available in the current feed.</p>}</div><button className="pm-back" onClick={onBack}>← All Crypto markets</button></aside></div></div></div>;
}
