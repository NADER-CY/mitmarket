export const marketNavigation = [
  ['Trending','trending'],['Combos','combos'],['Perps','perps'],['Breaking','breaking'],['New','new'],['Politics','politics'],['Sports','sports'],['Crypto','crypto'],['Esports','esports'],['Iran','iran'],['Finance','finance'],['Geopolitics','geopolitics'],['Tech','technology'],['Elections','elections'],['Culture','culture'],['Economy','economy'],['Weather','weather'],['Mentions','mentions'],['Art','art'],['Activity','live_activity'],['Leaderboard','leaderboard'],['Dashboard','portfolio_dashboard'],['Rewards','rewards_center'],
] as const;
const destinations = new Set(['live_activity','leaderboard','portfolio_dashboard','rewards_center']);
export function installMarketNavigation(doc:Document, screen:string, category:string, onCategory:(id:string)=>void,onScreen:(id:string)=>void) {
  const header=doc.querySelector('body > header');
  if(!header)return;
  let nav=doc.getElementById('mit-market-navigation');
  if(!nav){
    // Replace only the lower category strip, retaining the account/header controls.
    const anchor=header.querySelector('[data-path="breaking"],[data-path="crypto"],[data-path="politics"]');
    let strip=anchor?.parentElement;
    while(strip?.parentElement && strip.parentElement!==header && !strip.parentElement.classList.contains('h-10')) strip=strip.parentElement;
    const row=strip?.parentElement?.classList.contains('h-10')?strip.parentElement:strip;
    nav=doc.createElement('nav');nav.id='mit-market-navigation';nav.setAttribute('aria-label','Market categories');
    if(row && row!==header)row.replaceWith(nav);else header.appendChild(nav);
  }
  const active=screen==='explore'?category:screen==='crypto_category'?'crypto':screen==='sportsbook'?'sports':screen;
  const previousScroll=nav.scrollLeft;
  nav.replaceChildren(...marketNavigation.map(([label,id])=>{
    const button=doc.createElement('button');button.type='button';button.textContent=label;button.dataset.marketDestination=id;
    if(id===active)button.setAttribute('aria-current','page');
    button.onclick=event=>{event.preventDefault();event.stopPropagation();destinations.has(id)?onScreen(id):onCategory(id);};return button;
  }));
  nav.scrollLeft=previousScroll;
  if(!nav.dataset.scrollGestures){
    nav.dataset.scrollGestures='true';
    let pointer:number|null=null,startX=0,startScroll=0,dragged=false;
    nav.addEventListener('pointerdown',event=>{
      if(event.pointerType!=='mouse'||event.button!==0)return;
      pointer=event.pointerId;startX=event.clientX;startScroll=nav!.scrollLeft;dragged=false;
    });
    doc.addEventListener('pointermove',event=>{
      if(pointer!==event.pointerId)return;
      const distance=event.clientX-startX;
      if(!dragged&&Math.abs(distance)>6){dragged=true;nav!.setPointerCapture(event.pointerId);nav!.classList.add('is-dragging');}
      if(dragged){event.preventDefault();nav!.scrollLeft=startScroll-distance;}
    });
    const end=(event:PointerEvent)=>{if(pointer!==event.pointerId)return;pointer=null;nav!.classList.remove('is-dragging');if(nav!.hasPointerCapture(event.pointerId))nav!.releasePointerCapture(event.pointerId);};
    doc.addEventListener('pointerup',end);doc.addEventListener('pointercancel',end);
    nav.addEventListener('click',event=>{if(dragged){event.preventDefault();event.stopImmediatePropagation();dragged=false;}},true);
    nav.addEventListener('wheel',event=>{
      if(event.ctrlKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||nav!.scrollWidth<=nav!.clientWidth)return;
      const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?nav!.clientWidth:1);
      const before=nav!.scrollLeft;nav!.scrollLeft+=delta;
      if(nav!.scrollLeft!==before)event.preventDefault();
    },{passive:false});
    nav.addEventListener('focusin',event=>{(event.target as HTMLElement).scrollIntoView({block:'nearest',inline:'nearest'});});
  }
  if(!doc.getElementById('mit-market-navigation-style')){
    const style=doc.createElement('style');style.id='mit-market-navigation-style';style.textContent=`#mit-market-navigation{display:flex;align-items:center;gap:4px;height:40px;min-width:0;max-width:100%;padding:0 24px;overflow-x:auto;white-space:nowrap;background:#080a0d;scrollbar-width:none;-ms-overflow-style:none;touch-action:pan-x pan-y;cursor:grab;user-select:none;border-top:1px solid #20252d}#mit-market-navigation::-webkit-scrollbar{display:none;width:0;height:0}#mit-market-navigation.is-dragging,#mit-market-navigation.is-dragging button{cursor:grabbing}#mit-market-navigation button{flex:none;border:0;border-bottom:2px solid transparent;background:transparent;color:#98a5b5;padding:10px 9px;font:500 13px Inter,Arial,sans-serif;cursor:pointer}#mit-market-navigation button:hover{color:#eaa343}#mit-market-navigation button[aria-current]{color:#3d6bff;border-bottom-color:#3d6bff}.mit-category-menu{display:flex;flex-direction:column;gap:6px;min-width:145px;padding:20px 12px;align-self:start}.mit-category-menu button{background:transparent;border:0;text-align:left;color:#98a5b5;padding:7px 0;font:inherit;font-size:13px;cursor:pointer}.mit-category-menu button:hover{color:#eaa343}.mit-category-menu button[aria-current]{color:#3d6bff}.mit-market-layout{display:flex;align-items:flex-start}.mit-market-content{flex:1;min-width:0}@media(max-width:700px){#mit-market-navigation{padding:0 10px}.mit-market-layout{display:block}.mit-category-menu{flex-direction:row;overflow:auto;white-space:nowrap;padding:12px;gap:18px;scrollbar-width:none}.mit-category-menu::-webkit-scrollbar{display:none}}`;doc.head.appendChild(style);
  }
  if(screen==='explore'&&!doc.querySelector('.mit-category-menu')){
    const main=doc.querySelector('main');
    if(main){const content=doc.createElement('div');content.className='mit-market-content';content.append(...main.childNodes);const layout=doc.createElement('div');layout.className='mit-market-layout';const side=doc.createElement('aside');side.className='mit-category-menu';side.setAttribute('aria-label','Categories');for(const [label,id] of marketNavigation.filter(([,id])=>!destinations.has(id))){const button=doc.createElement('button');button.textContent=label;button.type='button';button.dataset.sideCategory=id;button.onclick=()=>onCategory(id);side.appendChild(button);}layout.append(side,content);main.appendChild(layout);}
  }
  doc.querySelectorAll<HTMLElement>('[data-side-category]').forEach(button=>{if(button.dataset.sideCategory===active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
}
