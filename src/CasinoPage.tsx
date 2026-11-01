import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import casinoCss from './casino.css?raw';

const categories = ['All Games','Live Casino','Table Games','Slots','Game Shows','Originals'] as const;
type Category = (typeof categories)[number];
type Game = {name:string;type:Exclude<Category,'All Games'>;icon:string;accent:string;detail:string;feature?:0|1|2};
const games:Game[] = [
  {name:'Royal Roulette',type:'Live Casino',icon:'◉',accent:'#1463ff',detail:'Immersive roulette table',feature:0},
  {name:'VIP Blackjack',type:'Table Games',icon:'♠',accent:'#0bba74',detail:'Premium card table',feature:1},
  {name:'Diamond Slots',type:'Slots',icon:'✦',accent:'#d6a75c',detail:'Three-reel slot experience',feature:2},
  {name:'Baccarat',type:'Live Casino',icon:'◆',accent:'#a588ff',detail:'Classic table experience'},
  {name:'Lightning Roulette',type:'Game Shows',icon:'ϟ',accent:'#f7bb57',detail:'Interactive wheel showcase'},
  {name:'Dice',type:'Originals',icon:'⚄',accent:'#f38a77',detail:'Original dice experience'},
  {name:'Crash',type:'Originals',icon:'↗',accent:'#45c4e7',detail:'Animated flight showcase'},
  {name:'Mega Wheel',type:'Game Shows',icon:'✺',accent:'#ff76bc',detail:'Game-show wheel'},
  {name:'Poker',type:'Table Games',icon:'♣',accent:'#78a9ff',detail:'Card-table experience'},
];
const slots=['🍒','💎','7','♛','⭐','🔔'];

function PreviewGame({game,onClose}:{game:Game;onClose:()=>void}){
  const [round,setRound]=useState(0);
  const [active,setActive]=useState(false);
  const reveal=()=>{setActive(true);setRound(v=>v+1);window.setTimeout(()=>setActive(false),1100);};
  const roulette=game.name.includes('Roulette');
  const blackjack=game.name.includes('Blackjack')||game.name==='Poker'||game.name==='Baccarat';
  const slot=game.name.includes('Slots');
  return <div className="mit-game-backdrop" onClick={onClose}>
    <section className="mit-game-stage" role="dialog" aria-modal="true" aria-label={`${game.name} interactive preview`} onClick={event=>event.stopPropagation()}>
      <div className="mit-game-header"><div><span>MITMARKET / CASINO / INTERACTIVE CONCEPT</span><h2>{game.name}</h2></div><button className="mit-game-close" onClick={onClose} aria-label="Close game">×</button></div>
      <div className={`mit-game-arena ${roulette?'is-roulette':blackjack?'is-cards':slot?'is-slots':'is-other'}`}>
        {roulette?<><div className="mit-roulette-wheel" style={{'--round-angle':`${round*540}deg`} as CSSProperties}><div className="mit-roulette-center">MIT<span>♦</span></div></div><div className="mit-roulette-layout"><div className="mit-roulette-numbers">{Array.from({length:36},(_,i)=><span key={i} className={i%2?'red':'black'}>{i+1}</span>)}</div><div className="mit-roulette-chips"><span>●</span><span>●</span><span>●</span><span>●</span></div></div></>:
        blackjack?<><div className="mit-felt-heading">MITMARKET PRIVATE TABLE</div><div className="mit-dealer-cards"><span>♠ A</span><span>♣ {round%2===0?'K':'Q'}</span></div><div className="mit-felt-ring"/><div className="mit-player-cards"><span>♥ {round%2===0?'9':'J'}</span><span>♦ {round%2===0?'7':'A'}</span></div><div className="mit-chip-stack">● ● ●</div></>:
        slot?<><div className="mit-slot-top">✦ MITMARKET DIAMONDS ✦</div><div className="mit-slot-reels">{[0,1,2].map((_,i)=><span key={i} className={active?'spinning':''}>{slots[(round*3+i*2)%slots.length]}</span>)}</div><div className="mit-slot-lights">◆ ◆ ◆ ◆ ◆ ◆ ◆</div></>:
        <><div className="mit-other-halo"/><span className="mit-other-glyph">{game.icon}</span><h3>{game.name}</h3></>}
      </div>
      <div className="mit-game-controls"><div><strong>INTERACTIVE DESIGN PREVIEW</strong><small>Visual controls only · No wagers, accounts, balances or payouts</small></div><button onClick={reveal} disabled={active}>{active?'Animating…':roulette?'Spin wheel':blackjack?'Deal cards':slot?'Spin reels':'Animate preview'}</button></div>
    </section>
  </div>;
}

export function CasinoPage(){
  const [category,setCategory]=useState<Category>('All Games');
  const [search,setSearch]=useState('');
  const [selected,setSelected]=useState<Game|null>(null);
  const visible=useMemo(()=>games.filter(g=>(category==='All Games'||g.type===category)&&g.name.toLowerCase().includes(search.toLowerCase())),[category,search]);
  const featured=games.filter(g=>g.feature!==undefined);
  return <div className="mit-casino"><style>{casinoCss}</style>
    <div className="mit-casino-inner">
      <section className="mit-casino-hero"><div className="mit-casino-hero-text"><span className="mit-casino-eyebrow"><span className="mit-casino-eyebrow-line"/> MITMARKET PREMIUM EXPERIENCE</span><h1>THE CASINO<br/><em>COLLECTION</em></h1><p>Discover beautiful game worlds, cinematic tables and immersive interactive experiences.</p><button onClick={()=>setSelected(featured[0])} className="mit-casino-explore">Explore the collection <span>↗</span></button><span className="mit-casino-status">VISUAL EXPERIENCE · GAMEPLAY PREVIEW ONLY</span></div><div className="mit-casino-hero-art" aria-hidden="true"/><div className="mit-casino-hero-fade"/></section>
      <div className="mit-casino-topline"><div><span className="mit-casino-overline">HANDPICKED EXPERIENCES</span><h2>Featured Games</h2></div><span className="mit-casino-count">01 — 03 <i/></span></div>
      <div className="mit-casino-featured">{featured.map(g=><button key={g.name} className={`mit-featured-card mit-featured-${g.feature}`} onClick={()=>setSelected(g)}><div className="mit-featured-image"/><div className="mit-featured-shade"/><div className="mit-featured-copy"><span>{g.type.toUpperCase()}</span><strong>{g.name}</strong><small>ENTER EXPERIENCE <b>↗</b></small></div></button>)}</div>
      <div className="mit-casino-topline mit-casino-browse-title"><div><span className="mit-casino-overline">DISCOVER MORE</span><h2>Explore the Casino</h2></div><span className="mit-casino-count">{visible.length} EXPERIENCES</span></div>
      <div className="mit-casino-toolbar"><div className="mit-casino-tabs" role="tablist" aria-label="Casino categories">{categories.map(c=><button key={c} type="button" role="tab" aria-selected={category===c} className={category===c?'selected':''} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="mit-casino-search"><span>⌕</span><input aria-label="Search casino games" placeholder="Search games" value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
      <div className="mit-casino-grid">{visible.map((g,i)=><button key={g.name} className="mit-casino-card" onClick={()=>setSelected(g)} style={{'--casino-accent':g.accent} as CSSProperties}><div className={`mit-casino-card-art ${g.feature!==undefined?'has-photo':''} photo-${g.feature??0} art-${i%4}`}><span className="mit-casino-glow"/>{g.feature===undefined&&<span className="mit-casino-glyph">{g.icon}</span>}<span className="mit-casino-card-arrow">↗</span></div><div className="mit-casino-card-content"><strong>{g.name}</strong><small>{g.detail}</small><span>{g.type}</span></div></button>)}</div>
      {visible.length===0&&<div className="mit-casino-empty">No games match your search.</div>}
      <p className="mit-casino-note">Concept experience only. These are interactive visual previews; real-money gameplay, wagering, balances and transactions are not available.</p>
    </div>
    {selected&&<PreviewGame key={selected.name} game={selected} onClose={()=>setSelected(null)}/>}
  </div>;
}
