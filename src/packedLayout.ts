// Keep the supplied artwork, layouts and widgets. Adapt flow, never scale the artboard.
export function preparePackedLayout(root:ShadowRoot,kind:string){
 const shell=root.querySelector<HTMLElement>('[data-pack-shell]');if(!shell)return;shell.dataset.layoutKind=kind;
 const mark=(el:Element|null,name:string)=>el?.setAttribute(`data-layout-${name}`,'');
 const direct=Array.from(shell.children).filter(el=>el.tagName!=='STYLE'&&el.tagName!=='SVG'&&!el.classList.contains('absolute')&&!/ambient|glow|mesh|grid-bg|institutional-grid|editorial-image|discovery-grid|hero-grid|bg-grid|stadium-ambient/.test(el.className));
 let body:Element|null=null;
 if(kind==='politics')body=shell.querySelector(':scope > section');
 else if(kind==='tech'){const wrap=shell.querySelector(':scope > div.relative.z-10');mark(wrap,'flow');body=wrap?.children[1]||null;mark(wrap?.children[0]||null,'header');}
 else if(kind==='weather')body=shell.querySelector('.slide-main');
 else if(kind==='geo')body=shell.querySelector('.slide-body');
 else if(kind==='sports')body=direct[0]||null;
 else if(kind==='category-crypto'){const flow=shell.querySelector(':scope > div.relative.z-10');mark(flow,'flow');body=flow?.querySelector(':scope > .grid')||null;mark(flow?.firstElementChild||null,'header');mark(flow?.lastElementChild||null,'footer');}
 else if(kind==='radar')body=null;
 else body=shell.querySelector(':scope > .grid')||shell.querySelector(':scope > main.grid')||(kind==='finance'?direct[1]:null);
 if(body){mark(body,'body');body.setAttribute('data-layout-columns',kind.startsWith('category-')?'3':'2');for(const col of body.children)if(col.tagName!=='SVG'){mark(col,'column');}}
 if(kind!=='tech'&&kind!=='category-crypto'){mark(shell.querySelector(':scope > header')||direct[0],'header');if(kind==='sports')shell.querySelector('[data-layout-body]')?.removeAttribute('data-layout-header');mark(shell.querySelector(':scope > footer')||direct[direct.length-1],'footer');}
 // Never show two pagination systems, the outer carousel owns navigation.
 shell.querySelectorAll('nav[aria-label*="Pagination"],nav[aria-label*="Carousel"],.carousel-pills,.carousel-pagination,[aria-label*="Slider Navigation"],[aria-label="Carousel Navigation"],[aria-label="Category Hero Carousel Navigation"]').forEach(el=>el.setAttribute('hidden',''));
 shell.querySelectorAll('[data-pack-chart]').forEach(el=>{mark(el,'chart');mark(el.parentElement,'chart-slot');});
 shell.querySelectorAll<HTMLElement>('h1,h2.market-title,.market-question,[data-pack-value="title"]').forEach(el=>mark(el,'title'));
 // Native font sizes are preserved or raised to a readable minimum, never squeezed.
 shell.querySelectorAll<HTMLElement>('span,strong,b,p,button,div').forEach(el=>{if(!el.children.length&&el.textContent?.trim()){const size=parseFloat(getComputedStyle(el).fontSize);if(size>0&&size<11)el.style.fontSize='11px';}});
 shell.querySelectorAll<HTMLElement>('[data-pack-value=volume],[data-pack-value=liquidity]').forEach(el=>{if((el.parentElement?.textContent||'').replace(el.textContent||'','').includes('USDT'))el.dataset.packNoUnit='true';});
 const text=(value:string)=>Array.from(shell.querySelectorAll<HTMLElement>('*')).filter(el=>el.children.length===0&&el.textContent?.trim()===value);
 const bind=(el:Element|undefined|null,field:string)=>el?.setAttribute('data-pack-value',field);
 for(const el of text('HISTORICAL PROBABILITY (120D)'))el.textContent='24H HISTORY';
 for(const el of text('(30D)'))el.textContent='24H';
 // Replace unsupported sample claims while retaining their designed positions.
 // News and weather observations require an actual provider; use live market context instead.
 shell.querySelectorAll<HTMLElement>('*').forEach(el=>{if(el.children.length===0&&/Sea surface temperatures|rapid intensification odds|Anthropic raises strategic|Fed Pulse: Core/.test(el.textContent||''))el.dataset.packValue='description';});
 for(const el of text('JUN 01'))if(el.parentElement)el.parentElement.hidden=true;
 for(const el of text('CAT 4+ THREAT TRACKER'))el.textContent='WEATHER MARKET';
 for(const el of text('RADAR FEED LIVE'))el.textContent='ILLUSTRATIVE RADAR';
 for(const el of text('• 90-DAY DIPLOMATIC SPREAD'))el.textContent='• 24H HISTORY';
 for(const el of text('• 90-DAY PROBABILITY CURVE'))el.textContent='• 24H HISTORY';
 shell.querySelectorAll<HTMLElement>('.radar-hud-tag').forEach(el=>{if(el.textContent?.includes('938'))el.textContent='ILLUSTRATIVE RADAR · NOT A LIVE WEATHER FEED';});
 const claims=['HIGH CONVICTION','HIGH LIQUIDITY','LEADING 58¢','RAPID INTENSIFICATION','ADVANCING','5 ACTIVE BLOCS','EDGAR / SEC REPOSITORY','NASDAQ / NYSE','NOAA / NHC Official Archive','NOAA / NHC OFFICIAL LANDFALL','UN & OFFICIAL TREATY REPOSITORY','Geneva Summit','HURRICANE SYSTEM 04L','ATLANTIC / GULF'];
 for(const value of claims)for(const el of text(value)){el.textContent=/SOURCE|REPOSITORY|Archive/.test(value)?'Public market feed':/ATLANTIC|HURRICANE|Geneva/.test(value)?'Illustrative map':'MARKET DATA';}
 for(const el of text('ANTHROPIC'))el.textContent='TECH & AI';
 for(const el of text('YES (68%)')){el.textContent='YES';}
 for(const el of text('NO (32%)')){el.textContent='NO';}
 for(const el of text('YES (RATIFIED)'))el.textContent='YES';
 // Primary outcome rows: fix the previous YES-to-NO binding and keep full-sized numbers.
 if(kind==='politics'){
  const articles=body?.children;
  if(articles?.[0]){const rows=articles[0].querySelector('.space-y-3')?.children;Array.from(rows||[]).forEach((row,i)=>{const val=row.querySelector<HTMLElement>('[data-pack-value="yes"]');if(val){val.hidden=false;bind(val,i===0?'yes':'no');mark(val,'primary');}if(i===1)row.querySelectorAll('[data-pack-value="no"]').forEach(e=>{if(e!==val)(e as HTMLElement).hidden=true;});});}
  for(const value of ['DEM','GOP'])for(const el of text(value))el.hidden=true;
  const diagram=shell.querySelector('#hemicycleSvg')?.parentElement?.parentElement;if(diagram){const labels=diagram.firstElementChild?.querySelectorAll('span:not([class*="w-"])');if(labels?.[0])bind(labels[0],'yes');if(labels?.[1])labels[1].textContent='PROBABILITY';if(labels?.[2])bind(labels[2],'no');diagram.querySelectorAll('div:last-child>span').forEach(e=>{if(e.textContent==='MARKET MONITOR')e.textContent='PROBABILITY SHARE';});}
  const ticker=shell.querySelector('#ticker-box');if(ticker){ticker.replaceChildren();const s=document.createElement('span');bind(s,'description');ticker.append(s);}
  const footer=shell.querySelector('[data-layout-footer]');bind(footer?.querySelector('div:first-child>span:first-child'),'volume');
 }
 if(kind==='tech'){
  const percent=Array.from(shell.querySelectorAll<HTMLElement>('[data-pack-value="yes"]')).filter(el=>/text-\[(24|26)px\]/.test(el.className));percent.forEach((el,i)=>{bind(el,i?'no':'yes');mark(el,'primary');});
  const intel=shell.querySelector('#headlineTicker');if(intel){intel.replaceChildren();const span=document.createElement('span');bind(span,'description');intel.append(span);}
  shell.querySelectorAll<HTMLElement>('span').forEach(el=>{if(/^(Claude\s*3\.5|Series\s*E|S-1\s*Draft|IPO\s*Window)$/.test(el.textContent?.trim()||'')){el.textContent='—';}});
  for(const el of Array.from(shell.querySelectorAll<HTMLElement>('*')))if(el.children.length===0&&/Anthropic raises|Claude 3\.5|Series E|S-1 Draft|IPO Window/.test(el.textContent||'')){bind(el,/Anthropic/.test(el.textContent||'')?'description':'unknown');}
 }
 if(kind==='finance'){
  const fields:['Cut 25 bps'|'Pause'|'Cut 50+ bps'|'Hike',string][]=[['Cut 25 bps','policy-cut25'],['Pause','policy-pause'],['Cut 50+ bps','policy-cut50'],['Hike','policy-hike']];
  for(const [label,field] of fields){const el=Array.from(shell.querySelectorAll('span')).find(e=>e.firstChild?.textContent?.trim()===label);bind(el?.querySelector('strong'),field);}
  const related=shell.querySelector('[data-pack-list]');if(related)mark(related,'market-list');
  const policy=body?.children[1]?.firstElementChild;const biases=policy?.firstElementChild?.querySelectorAll('[data-pack-value]');bind(biases?.[0],'policy-easing');bind(biases?.[1],'policy-hike');
  const catalyst=shell.querySelector('#chartInteractionContainer')?.nextElementSibling;catalyst?.querySelectorAll('[data-pack-value]').forEach((el,i)=>{if(i===0)bind(el,'date');else(el as HTMLElement).hidden=true;});
  const spectrum=shell.querySelector('.spectrum-marker');if(spectrum){spectrum.removeAttribute('title');mark(spectrum,'marker');}
  const intelligence=shell.querySelector('#intelHeadlineWrapper');if(intelligence){intelligence.replaceChildren();const p=document.createElement('span');bind(p,'description');intelligence.append(p);}
 }
 for(const value of ['PROTOTYPE TELEMETRY','ILLUSTRATIVE VALUES'])for(const el of text(value))el.hidden=true;
 if(kind==='category-new'){
  const center=body?.children[1];const rows=center?.children[1];if(rows){rows.setAttribute('data-pack-list','');mark(rows,'market-list');rows.replaceChildren();}
 }
 if(kind==='category-combos'){
  shell.querySelectorAll<HTMLElement>('[data-pack-value]').forEach(el=>{if(/CORRELATION PENALTY|INDIVIDUAL LEGS|COMBINED LEVERAGE|FAIR VALUE/.test(el.parentElement?.textContent||''))bind(el,'unknown');});
  shell.querySelectorAll<HTMLElement>('*').forEach(el=>{if(el.children.length===0&&/5\.82x|17\.2|1\.2¢|4 HIGH-CONFIDENCE|LIVE CORRELATION/.test(el.textContent||'')){el.textContent=/LIVE/.test(el.textContent||'')?'PUBLIC MARKET DATA':'—';}});
 }
 if(kind==='category-breaking'){
  for(const [sample,replacement] of [['Draft Text Leaked','Market listed'],['Source: Diplomatic Desk','Public market feed'],['Official Geneva Accord','Market source'],['Market Repriced','Latest quote'],['STAGE 3 / 3 COMPLETED','MARKET TIMELINE']])for(const el of text(sample))el.textContent=replacement;
 }
 if(kind==='category-sports'){
  const chart=shell.querySelector('[data-pack-chart]'),row=chart?.parentElement?.parentElement;mark(row||null,'sports-history');
  const example=row?.lastElementChild;if(example&&example!==chart?.parentElement){example.replaceChildren();const span=document.createElement('span');span.textContent='24H MARKET HISTORY';example.append(span);}
  shell.querySelectorAll<SVGTextElement>('#sport-arena-svg text').forEach(el=>el.textContent='');
  for(const el of text('R. MADRID'))bind(el,'outcome');for(const el of text('BARCELONA'))bind(el,'opposite');
 }
 if(kind==='sports'){
  const left=body?.children[0];const buttons=Array.from(left?.querySelectorAll('button')||[]).filter(el=>el.querySelectorAll('span').length>=2);
  buttons.slice(0,8).forEach((button,i)=>{button.replaceChildren();button.dataset.packAction=String(Math.floor(i/2));for(const field of [i%2?'opposite':'outcome',i%2?'no':'yes']){const span=document.createElement('span');span.dataset.packValue=field;span.dataset.packIndex=String(Math.floor(i/2));span.textContent='—';button.append(span);}});
  for(const value of ['1. Featured market' ,'3. Related market','4. Related market'])for(const el of text(value))el.style.fontSize='11px';
 }
 if(kind==='weather'){
  const trajectory=shell.querySelector('.chart-trajectory-area');const legend=trajectory?.querySelectorAll('[data-pack-value="yes"]');if(legend?.[1])bind(legend[1],'no');
  const viewport=shell.querySelector('.radar-viewport');mark(viewport,'weather-radar');
  shell.querySelectorAll('.trajectory-axis-row,.chart-axis-labels,.trajectory-months').forEach(el=>el.setAttribute('hidden',''));
 }
 if(kind==='radar'){
  const stage=shell.querySelector('.radar-grid');mark(stage,'radar-stage');mark(stage?.parentElement||null,'radar-visual');
  // The radar visual stays; compact secondary telemetry rather than cutting off rows.
  const list=shell.querySelector('[data-pack-list]');mark(list,'radar-list');
  for(const label of ['ACTIVE MKTS','SIGNALS']){const el=text(label)[0];if(el?.parentElement)el.parentElement.hidden=true;}
 }
}
export const packedLayoutCss=`
:host{display:block;width:100%;font-family:Inter,Arial,sans-serif;font-variant-numeric:tabular-nums;color:#f4f6fa}*{box-sizing:border-box} [hidden]{display:none!important}[data-pack-shell]{container-type:inline-size;container-name:packed;width:100%!important;max-width:none!important;height:460px!important;min-height:460px!important;max-height:460px!important;border:0!important;box-shadow:none!important;transform:none!important;padding:24px!important;display:flex!important;flex-direction:column!important;gap:14px!important;overflow:hidden!important;font-family:Inter,Arial,sans-serif!important}[data-pack-shell] span,[data-pack-shell] strong,[data-pack-shell] p,[data-pack-shell] button,[data-pack-shell] h1,[data-pack-shell] h2{font-family:Inter,Arial,sans-serif!important}[data-layout-header],[data-layout-footer]{flex:none!important;height:auto!important;min-width:0;max-width:100%;gap:10px!important}[data-layout-header]{min-height:22px;align-items:center!important}[data-layout-header]>div:first-child{min-width:0;overflow:hidden}[data-layout-header] [class*="uppercase"]{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}[data-layout-header] h1{white-space:normal!important}[data-layout-title]{font-size:20px!important;line-height:1.3!important;font-weight:750!important;letter-spacing:-.3px!important;white-space:normal!important;display:-webkit-box!important;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;max-width:100%;margin-bottom:8px!important}[data-layout-flow]{display:flex!important;flex-direction:column!important;flex:1!important;min-height:0!important;height:auto!important;gap:14px!important}[data-layout-body]{flex:1 1 0!important;min-height:0!important;height:auto!important;max-height:100%;width:100%!important;display:grid!important;grid-template-columns:minmax(0,38fr) minmax(0,62fr)!important;gap:22px!important;margin:0!important;padding:0!important;overflow:hidden}[data-layout-body][data-layout-columns="3"]{grid-template-columns:minmax(0,30fr) minmax(0,43fr) minmax(0,27fr)!important;gap:20px!important}[data-layout-column]{grid-column:auto!important;height:100%!important;min-width:0!important;min-height:0!important;width:auto!important;max-width:100%!important;overflow:hidden;padding-left:0!important;padding-right:0!important}[data-layout-column]>.flex,[data-layout-column]>.grid{min-width:0;max-width:100%}[data-layout-column] .h-full{min-height:0}[data-layout-chart-slot]{min-height:100px!important;min-width:0!important;width:100%!important;flex:1 1 0!important;height:auto!important;overflow:hidden;margin-top:10px!important}[data-layout-chart]{width:100%!important;height:100%!important;min-height:80px!important;position:relative!important}[data-layout-chart] svg{width:100%;height:100%;display:block}[data-layout-primary]{font-size:28px!important;line-height:1.1!important;white-space:nowrap}[data-pack-value="delta"]{font-size:11px!important;white-space:nowrap}[data-pack-list]{min-width:0;overflow:hidden}[data-pack-list]>button{font-size:12px!important;line-height:1.4!important;min-height:35px;display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:7px 9px!important;text-align:left}[data-pack-list]>button>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}[data-pack-list]>button>b{flex:none;white-space:nowrap;font-size:13px!important;color:#0bba74}[data-layout-footer]{font-size:11px!important;line-height:1.4!important;padding-top:9px!important;padding-bottom:12px!important;border-top:0!important;overflow:hidden}[data-layout-footer]>div{min-width:0;flex-wrap:wrap;row-gap:5px}[data-layout-footer] .footer-sep{display:none}.pack-history-state{display:grid;place-items:center;width:100%;height:100%;color:#929aaa;font-size:12px}.pack-chart-tip{position:absolute;bottom:22px;left:8px;padding:5px 8px;background:#15191f;border-radius:5px;font-size:11px;color:#f4f6fa;pointer-events:none}
[data-layout-kind="politics"] [data-layout-header]{align-items:flex-start!important}[data-layout-kind="politics"] [data-layout-column]{display:flex;flex-direction:column;gap:8px}[data-layout-kind="politics"] #ticker-box{font-size:12px;height:36px;max-height:36px;overflow:hidden;align-items:flex-start!important;padding-top:4px!important}[data-layout-kind="politics"] #ticker-box>span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:16px}[data-layout-kind="politics"] .my-auto{margin-top:auto!important;margin-bottom:auto!important}[data-layout-kind="finance"] [data-layout-column]:last-child{gap:10px}[data-layout-kind="finance"] [data-layout-column]:last-child>div:first-child{flex:none}[data-layout-kind="finance"] [data-layout-column]:last-child>div:first-child>div:last-child{flex-wrap:wrap;gap:7px}[data-layout-kind="finance"] [data-layout-column]:last-child>div:first-child>div:last-child>div{display:grid!important;grid-template-columns:1fr 1fr;gap:6px!important;width:100%}[data-layout-kind="finance"] [data-layout-column]:last-child>div:first-child>div:last-child>span{display:none}[data-layout-kind="finance"] #intelHeadlineWrapper{height:auto!important;max-height:38px;line-height:1.4;font-size:12px}[data-layout-kind="tech"] [data-layout-body]>div:first-child{width:auto!important}[data-layout-kind="tech"] [data-layout-body]>div:first-child>div:last-child{max-height:54px;overflow:hidden}[data-layout-kind="tech"] [data-layout-body]>div:last-child{min-width:0;gap:8px}[data-layout-kind="weather"] .taxonomy-crumb,[data-layout-kind="weather"] .taxonomy-highlight,[data-layout-kind="geo"] .taxonomy-active{display:none}[data-layout-kind="weather"] .radar-viewport{height:58%!important;min-height:140px!important;max-height:180px!important}[data-layout-kind="weather"] .chart-trajectory-area,[data-layout-kind="geo"] .trajectory-container{flex:1!important;min-height:100px!important;height:auto!important;overflow:hidden}[data-layout-kind="geo"] .map-stage{height:58%!important;min-height:145px!important;max-height:180px!important}[data-layout-kind="geo"] .trajectory-container [data-layout-chart-slot]{height:100%!important;min-height:90px!important;margin-top:0!important}[data-layout-kind="weather"] .chart-trajectory-area [data-layout-chart-slot]{height:100%!important;min-height:80px!important;margin-top:0!important}
[data-layout-kind="sports"] [data-layout-body]{grid-template-columns:minmax(0,40fr) minmax(0,60fr)!important}[data-layout-kind="sports"] [data-layout-column]{display:flex;flex-direction:column;gap:8px}[data-layout-kind="sports"] h1{font-size:19px!important;-webkit-line-clamp:2}[data-layout-kind="sports"] [data-layout-column]:last-child>div:last-child{max-height:30px;overflow:hidden}[data-layout-kind="sports"] [data-layout-column]:last-child{min-height:0}[data-layout-kind="sports"] [data-pack-chart]{min-height:100px!important}[data-layout-kind="sports"] [data-pack-value="yes"],[data-layout-kind="sports"] [data-pack-value="no"]{font-size:16px!important}
[data-layout-kind^="category-"] [data-layout-header]{font-size:11px!important;max-height:40px;overflow:hidden}[data-layout-kind^="category-"] [data-layout-body]{padding-top:2px!important}[data-layout-kind^="category-"] [data-layout-title]{font-size:20px!important}[data-layout-kind^="category-"] [data-layout-footer]{max-height:40px;overflow:hidden}[data-layout-kind^="category-"] [data-layout-column]{display:flex;flex-direction:column;justify-content:space-between;gap:10px}[data-layout-kind="category-combos"] [data-layout-body]{grid-template-columns:minmax(0,28fr) minmax(0,46fr) minmax(0,26fr)!important}[data-layout-kind="category-combos"] [data-layout-column]:nth-child(2){height:100%!important;min-height:0;overflow:hidden}[data-layout-kind="category-combos"] [data-layout-column]:nth-child(2)>div{gap:8px}[data-layout-kind="category-sports"] #arena-canvas-container{height:150px!important;min-height:150px!important;flex:none!important}[data-layout-kind="category-sports"] [data-layout-sports-history]{height:110px!important;min-height:110px!important;max-height:110px!important;flex:none!important;gap:6px}[data-layout-kind="category-sports"] [data-layout-sports-history]>div:last-child{max-width:65px;font-size:10px}[data-layout-kind="category-sports"] [data-layout-sports-history] [data-layout-chart-slot]{height:100%!important;min-height:90px!important;margin-top:0!important}[data-layout-kind="category-sports"] [data-pack-value="home"],[data-layout-kind="category-sports"] [data-pack-value="away"]{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:13px!important;line-height:1.35;max-height:36px}[data-pack-row]{font-size:12px!important;line-height:1.4!important;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;max-height:3em!important}[data-layout-kind="category-new"] [data-layout-market-list]{height:auto!important;flex:1!important;display:flex;flex-direction:column;gap:6px}[data-layout-kind="category-new"] [data-pack-list]>button{min-height:48px!important;font-size:12px!important;border:1px solid #293344;border-radius:8px;background:#15191f}[data-layout-kind="category-new"] [data-pack-list]>button>span{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}[data-layout-kind="tech"] #headlineTicker{max-height:44px;line-height:16px;overflow:hidden;font-size:12px}[data-layout-kind="category-breaking"] [data-layout-column]:last-child{border:0}[data-layout-kind="category-new"] [data-layout-column]>div{min-width:0}
[data-layout-kind="radar"]{padding:18px!important;gap:8px!important}[data-layout-kind="radar"] h2{font-size:15px!important}[data-layout-kind="radar"] [data-layout-radar-visual]{flex:none!important;margin:0!important;height:185px!important}[data-layout-kind="radar"] [data-layout-radar-stage]{width:185px!important;height:185px!important}[data-layout-kind="radar"] [data-layout-radar-list]>button{min-height:32px;font-size:11px!important;padding:5px 0!important}[data-layout-kind="radar"] [data-layout-footer]{padding-bottom:0!important}[data-layout-kind="radar"] #tooltipName{max-width:145px!important;font-size:12px!important}[data-layout-kind="radar"] #tooltipProb{font-size:15px!important}[data-layout-kind="radar"] p{display:none}

@container packed (max-width:1200px){
 [data-layout-kind^="category-"] [data-layout-header]{height:30px!important;min-height:30px!important;max-height:30px!important;white-space:nowrap!important;overflow:hidden!important;gap:12px!important}
 [data-layout-kind^="category-"] [data-layout-header]>div{flex-shrink:0!important;flex-wrap:nowrap!important}
 [data-layout-kind="category-breaking"] [data-layout-header]>div:nth-child(2){display:none!important}
 [data-layout-kind="category-breaking"] [data-layout-header]>div:first-child>div:last-child{display:none!important}
 [data-layout-kind="category-new"] [data-layout-header]>div:first-child>:nth-child(n+2){display:none!important}
 [data-layout-kind="category-sports"] [data-layout-header]>div:first-child>div:nth-child(2){display:none!important}
 [data-layout-kind="category-crypto"] [data-layout-header]>div:first-child>:nth-child(n+2){display:none!important}
 [data-layout-kind="category-perps"] [data-layout-header]>div:first-child>div:nth-child(2){display:none!important}
}
[data-layout-kind="radar"] [data-layout-radar-list]{max-height:36px;overflow:hidden}[data-layout-kind="radar"] [data-layout-radar-stage]{width:170px!important;height:170px!important}[data-layout-kind="radar"] [data-layout-radar-visual]{height:170px!important}[data-layout-kind="radar"] #tooltipName{-webkit-line-clamp:2!important}[data-layout-kind="radar"] [data-layout-footer]{font-size:10px!important;max-height:30px!important;min-height:0!important}
`;

