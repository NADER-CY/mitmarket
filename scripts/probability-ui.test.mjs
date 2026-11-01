import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(path.join(repo,'package.json'));
const {createServer}=await import(pathToFileURL(path.join(repo,'node_modules/vite/dist/node/index.js')));
const React=require('react');
const {createRoot}=require('react-dom/client');
const {renderToStaticMarkup}=require('react-dom/server');
const server=await createServer({root:repo,server:{middlewareMode:true},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]}});
const {ProbabilityDisplay}=await server.ssrLoadModule('/src/ProbabilityDisplay.tsx');
const {paintFrameProbability}=await server.ssrLoadModule('/src/frameProbability.ts');
const {useFrameBridge}=await server.ssrLoadModule('/src/frameBridge.ts');
const {MarketTile,ContractListCard,MatchCentreCard,MarketMosaic}=await server.ssrLoadModule('/src/MarketMosaic.tsx');
const {liveQuotes}=await server.ssrLoadModule('/src/quoteStore.ts');
const globalDom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'});
for(const k of ['window','document','Node','NodeFilter','HTMLElement','MutationObserver'])globalThis[k]=globalDom.window[k];
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.localStorage=window.localStorage;
globalThis.WebSocket=class {static OPEN=1;readyState=0;close(){} send(){}};
const market={id:'same-market',eventId:'event',title:'Actual contract?',eventTitle:'Event title',category:'Markets',outcomes:['First','Second','Third'],prices:[.62,.29,.15],tokenIds:['first-token','second-token','third-token'],volume24h:12,volumeTotal:20,liquidity:2,startTime:0};
const markup=renderToStaticMarkup(React.createElement(ProbabilityDisplay,{market}));
assert.match(markup,/62.0%/);assert.match(markup,/29.0%/);assert.match(markup,/15.0%/);
const widths=[...new JSDOM(markup).window.document.querySelectorAll('.probability-track>span')].map(el=>parseFloat(el.style.width));
assert.ok(widths.every((value,i)=>Math.abs(value-[62,29,15][i])<1e-8));
assert.doesNotMatch(markup,/38.0%/);
for(const value of [null,undefined,NaN,Infinity,-.1,1.1]){
 const html=renderToStaticMarkup(React.createElement(ProbabilityDisplay,{market:{outcomes:['Missing'],prices:[value]}}));
 assert.match(html,/Unavailable/);assert.equal(new JSDOM(html).window.document.querySelectorAll('.probability-track>span').length,0);
}
for(const value of [0,1]){
 const html=renderToStaticMarkup(React.createElement(ProbabilityDisplay,{market:{outcomes:['Valid'],prices:[value]}}));
 assert.match(html,new RegExp(`width:${value*100}%`));
}
const calls=[];
globalThis.fetch=async url=>{calls.push(String(url));return {ok:true,json:async()=>({history:[{t:1,p:.5},{t:2,p:.62}]})};};
async function mount(screen,viewport,selected,selectedOutcome=0){
 const html=await readFile(path.join(repo,`public/stitch/stitch_atlas_prediction_market_platform/atlas_${screen==='trending'?'home':screen}_${viewport}/code.html`),'utf8');
 const dom=new JSDOM(html,{url:'http://localhost/'});
 const ref={current:{contentDocument:dom.window.document}};
 const container=document.createElement('div');document.body.appendChild(container);const root=createRoot(container);
 const options={frame:ref,screen,viewport,category:'all',markets:[market],selected,selectedOutcome,onCategory:()=>{},onMarket:id=>calls.push('navigate:'+id),onTrending:()=>{},currency:'USD',fxRate:1,language:'en'};
 function Harness(){useFrameBridge(options);return null;}
 await React.act(async()=>{root.render(React.createElement(Harness));});
 return {doc:dom.window.document,dom,root,options};
}
try{
 for(const viewport of ['desktop','mobile']){
  const {doc,root}=await mount('home',viewport);
  assert.ok(doc.querySelector('.probability-display'),`${viewport} homepage probability missing`);
  assert.equal(doc.querySelectorAll('svg[viewBox="0 0 500 50"],svg[viewbox="0 0 500 50"],svg[viewBox="0 0 120 40"],svg[viewbox="0 0 120 40"]').length,0);
  assert.equal(calls.filter(x=>x.includes('prices-history')).length,0);
  await React.act(async()=>{liveQuotes.publish(new Map([['first-token',.71]]));});
  assert.match(doc.querySelector('.probability-display').textContent,/71.0%/);
  await React.act(async()=>root.unmount());
 }
 for(const viewport of ['desktop','mobile']){
  calls.length=0;const {doc,dom,root}=await mount('binary_market',viewport,market,1);
  assert.match(doc.getElementById('mit-selected-trade-target').textContent,/Second/);
  assert.equal((doc.getElementById('btn-outcome-no')??doc.getElementById('sideNo'))?.getAttribute('aria-pressed'),'true');
  assert.equal(calls.filter(x=>x.includes('prices-history')).length,0);
  const toggle=doc.getElementById('mit-open-history');assert.ok(toggle,`${viewport} chart toggle missing`);
  assert.equal(toggle.textContent,'Open chart');
  await React.act(async()=>toggle.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true})));
  assert.equal(calls.filter(x=>x.includes('prices-history')).length,1);
  assert.ok(calls.some(x=>x.includes('market=second-token')),'Requested history must match selected outcome');
  assert.equal(toggle.textContent,'Close chart');
  await React.act(async()=>toggle.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true})));
  assert.equal(toggle.textContent,'Open chart');
  await React.act(async()=>root.unmount());
 }
 const doc=new JSDOM('<div id="host"></div>').window.document;
 paintFrameProbability(doc,doc.getElementById('host'),market,false);
 assert.equal(doc.querySelectorAll('.probability-row').length,3);
 assert.match(doc.body.textContent,/29.0%/);
 for(const viewport of ['mobile']){
  calls.length=0;const {doc,root}=await mount('trending',viewport);
  assert.ok(doc.querySelector('.probability-featured'));
  assert.equal(doc.querySelectorAll('svg[viewBox="0 0 120 40"],svg[viewbox="0 0 120 40"]').length,0);
  assert.equal(calls.filter(x=>x.includes('prices-history')).length,0);
  await React.act(async()=>root.unmount());
 }
 globalThis.fetch=async url=>{
  const target=String(url);calls.push(target);
  const data=target.includes('prices-history')?{history:[{t:1,p:.5},{t:2,p:.62}]}:
    target.includes('/book?')?{bids:[{price:'.6',size:'1'}],asks:[{price:'.64',size:'1'}]}:
    target.includes('bybit.com')?{retCode:0,result:{list:[]}}:
    {id:market.id,question:market.title,clobTokenIds:market.tokenIds,outcomes:market.outcomes,outcomePrices:['.62','.29','.15'],events:[]};
  return {ok:true,json:async()=>data};
 };
 const crypto=await server.ssrLoadModule('/src/CryptoMarketDetail.tsx');
 const combo=await server.ssrLoadModule('/src/ComboGameDetail.tsx');
 const perps=await server.ssrLoadModule('/src/PerpsPage.tsx');
 const hero=await server.ssrLoadModule('/src/CryptoHero.tsx');
 for(const [Component,props,openLabel,historyMatch] of [
  [crypto.CryptoMarketDetail,{id:market.id,market:{...market,eventId:''},language:'en',related:[],onMarket:()=>{},onBack:()=>{}},'Market probability','prices-history'],
  [combo.ComboGameDetail,{id:market.id,market:{...market,eventId:''},language:'en',related:[],onMarket:()=>{},onBack:()=>{}},'Open chart','prices-history'],
  [perps.PerpsPage,{},'Open chart','/kline?'],
  [hero.CryptoHero,{marketCount:1,markets:[{title:market.title,yes:.62,no:.29,outcomes:market.outcomes,prices:market.prices,coins:['BTC'],volume:12}],symbols:['BTC']},null,'prices-history'],
 ]){
  calls.length=0;const container=document.createElement('div');document.body.appendChild(container);const root=createRoot(container);
  await React.act(async()=>root.render(React.createElement(Component,props)));
  assert.equal(calls.filter(x=>x.includes(historyMatch)).length,0,Component.name+' loads history before opening');
  if(openLabel){
   const button=[...container.querySelectorAll('button')].find(x=>x.textContent===openLabel);assert.ok(button);
   await React.act(async()=>button.dispatchEvent(new window.MouseEvent('click',{bubbles:true})));
   assert.ok(calls.some(x=>x.includes(historyMatch)),Component.name+' did not load opened chart');
   const close=[...container.querySelectorAll('button')].find(x=>x.textContent==='Close chart');assert.ok(close);
   await React.act(async()=>close.dispatchEvent(new window.MouseEvent('click',{bubbles:true})));
  }
  await React.act(async()=>root.unmount());container.remove();
 }
 const targetCalls=[];
 const question='Will Bitcoin close above $100,000 on Friday, November 6, after the official daily settlement?';
 const binary={...market,id:'binary',title:question,category:'Crypto',outcomes:['Yes','No'],prices:[.64,.31]};
 const thresholdA={...binary,id:'above-100',eventId:'thresholds',eventTitle:'Bitcoin thresholds',title:'Will Bitcoin close above $100,000?',prices:[.64,.31]};
 const thresholdB={...thresholdA,id:'above-110',title:'Will Bitcoin close above $110,000?',prices:[.38,.57]};
 const sports=[0,1,2].map(i=>({...binary,id:'match-'+i,eventId:'match-event-'+i,category:'Sports',title:['Arsenal vs Chelsea','Lakers vs Celtics','Inter vs Milan'][i],outcomes:['Home','Away'],prices:[.58-i*.05,.39+i*.04]}));
 const container=document.createElement('div');document.body.appendChild(container);const root=createRoot(container);
 const open=(id,index)=>targetCalls.push([id,index]);
 await React.act(async()=>root.render(React.createElement(MarketMosaic,{markets:[...sports,binary,thresholdA,thresholdB],onMarket:open})));
 for(const layout of ['matches','binary','contracts','featured'])assert.ok(container.querySelector(`[data-layout="${layout}"]`),'Missing approved '+layout+' concept');
 assert.equal(container.querySelector('.mm-matches').querySelectorAll('.mm-match').length,3);
 assert.ok([...container.querySelectorAll('.mm-question')].some(el=>el.textContent===question),'Full question must remain readable');
 assert.doesNotMatch(container.textContent,/CURRENT PROBABILITY|HISTORICAL/);
 const contracts=container.querySelector('.mm-contracts');
 assert.match(contracts.textContent,/Independent contracts/);assert.doesNotMatch(contracts.textContent,/Select a range|mutually exclusive/);
 const second=[...contracts.querySelectorAll('.mm-option')].find(el=>el.textContent.includes('above $110,000'));
 await React.act(async()=>second.dispatchEvent(new window.MouseEvent('click',{bubbles:true})));
 assert.match(contracts.querySelector('.mm-selected').textContent,/above \$110,000/);
 const no=contracts.querySelector('.mm-trade.mm-no');assert.match(no.textContent,/57¢/);
 await React.act(async()=>no.dispatchEvent(new window.MouseEvent('click',{bubbles:true})));
 assert.deepEqual(targetCalls.at(-1),['above-110',1]);
 await React.act(async()=>root.render(React.createElement(MarketTile,{market,onMarket:open})));
 const third=container.querySelectorAll('.mm-option')[2];
 await React.act(async()=>third.dispatchEvent(new window.MouseEvent('click',{bubbles:true})));
 assert.equal(container.querySelectorAll('.mm-trade').length,1);
 await React.act(async()=>container.querySelector('.mm-trade').dispatchEvent(new window.MouseEvent('click',{bubbles:true})));
 assert.deepEqual(targetCalls.at(-1),['same-market',2]);
 await React.act(async()=>root.render(React.createElement(MarketTile,{market:binary,onMarket:open,featured:true})));
 assert.equal(container.querySelectorAll('.probability-gauge').length,1);
 assert.equal(container.querySelectorAll('.probability-row').length,0,'Featured gauge must not repeat probability panels');
 assert.equal(container.querySelectorAll('#mm-layout-style').length,0);
 assert.equal(document.querySelectorAll('#mm-layout-style').length,1,'Install shared card CSS once per document');
 await React.act(async()=>root.unmount());container.remove();
 console.log('PASS: independent same-market prices; missing/invalid/zero/one states; desktop/mobile iframe home and mobile trending; live price updates; iframe, crypto, combo and perps explicit chart loading; category hero has no history requests; all four mosaic layouts, full titles, independent threshold contracts, and exact market/outcome trade selection.');
}finally{globalDom.window.close();await server.close();}
