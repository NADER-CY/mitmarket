import {useEffect,useMemo,useState} from 'react';
import type {Market} from './marketCatalog';
import {PackedHero,usePackedFeed,usePackedQuotes,type PackedKind} from './PackedHero';
import {DesktopCryptoSlide} from './DesktopCryptoSlide';
import {selectFeaturedCrypto} from './selectFeaturedCrypto';
import {useMarkets} from './sharedMobileMarketData';
import {useLiveMarkets as useMobileQuotes} from './sharedMobileLiveMarkets';
export function PackedTrending({onMarket}:{onMarket:(id:string)=>void}){
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false);
 const crypto=useMarkets('crypto'),sports=usePackedFeed('sports'),politics=usePackedFeed('politics'),tech=usePackedFeed('tech'),finance=usePackedFeed('finance'),weather=usePackedFeed('weather'),geo=usePackedFeed('geopolitics');
 const selection=useMemo(()=>selectFeaturedCrypto(crypto.markets),[crypto.markets]);const cryptoLive=useMobileQuotes(selection);const c=cryptoLive.markets[0];
 const cryptoMarket:Market|undefined=c?{id:c.id,eventId:c.eventId||c.id,eventSlug:c.slug,title:c.title,eventTitle:c.eventTitle||c.title,category:'Crypto',image:c.image,tokenIds:[c.token],outcomes:['Up','Down'],prices:[c.yes/100,c.no/100],volume24h:0,volumeTotal:c.volume,liquidity:c.liquidity||0,startTime:0,endDate:c.endDate}:undefined;
 const catalogs=[sports.markets,politics.markets,tech.markets,finance.markets,weather.markets,geo.markets];const patterns=[/counter.strike|cs2|esports/i,/senate|election|president|government/i,/anthropic|openai|ai model|ipo/i,/federal reserve|fed |interest rate|fomc/i,/hurricane|temperature|weather|hottest/i,/treaty|ceasefire|peace|agreement/i];
 const picked=catalogs.map((rows,i)=>rows.find(m=>patterns[i].test(m.title)&&m.prices[0]>.05&&m.prices[0]<.95)||rows.find(m=>m.prices[0]>.05&&m.prices[0]<.95)||rows[0]);const quoteInputs=useMemo(()=>picked.filter((m):m is Market=>!!m),[picked.map(m=>m?.id).join('|')]);const stream=usePackedQuotes(quoteInputs);
 const active=picked[index-1],lead=stream.markets.find(m=>m.id===active?.id);const kinds:PackedKind[]=['sports','politics','tech','finance','weather','geo'];
 const group=lead?[lead,...catalogs[index-1].filter(m=>m.id!==lead.id&&m.eventId===lead.eventId).slice(0,4)]:[];
 useEffect(()=>{if(paused)return;const timer=setInterval(()=>setIndex(i=>(i+1)%7),12000);return()=>clearInterval(timer);},[paused]);
 return <div className="packed-trending-layout" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setPaused(false);}}><div className="packed-trending-main">{index===0?(cryptoMarket?<DesktopCryptoSlide market={cryptoMarket} related={[]} connection={cryptoLive.connection} onMarket={onMarket} index={0} count={7} onSlide={setIndex}/>:<div className="packed-loading">Connecting to the live crypto market…</div>):<PackedHero key={kinds[index-1]} kind={kinds[index-1]} markets={group} connection={stream.connection} onMarket={onMarket}/>}<div className="packed-slide-controls" aria-label="Trending slide navigation"><button aria-label="Previous trending slide" onClick={()=>setIndex(i=>(i+6)%7)}>‹</button>{['Crypto','Sports','Politics','Tech & AI','Finance','Weather','Geopolitics'].map((name,i)=><button key={name} aria-label={`Trending slide ${i+1}: ${name}`} aria-current={i===index?'true':undefined} onClick={()=>setIndex(i)}>{i===index?<span>{name}</span>:<i/>}</button>)}<button aria-label="Next trending slide" onClick={()=>setIndex(i=>(i+1)%7)}>›</button></div></div><aside className="packed-trending-radar" aria-label="Live market radar"><PackedHero kind="radar" height={460} markets={stream.markets} connection={stream.connection} onMarket={onMarket}/></aside></div>;
}
