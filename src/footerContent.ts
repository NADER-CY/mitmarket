import type { Market } from './live';
import type { Language } from './i18n';
import { categories, type CategoryId } from './categories';

const popularTopics = ['Finance','Crypto','Politics','Sports','Economy','Elections','Technology','Geopolitics','Culture','AI'];
function distinctEvents(markets:Market[],count:number){const seen=new Set<string>();return markets.filter(m=>{const id=m.eventTitle||m.id;if(seen.has(id))return false;seen.add(id);return true;}).slice(0,count);}

function button(doc:Document,label:string,marketId:string) {
  const el=doc.createElement('button');el.type='button';el.textContent=label;el.dataset.footerMarket=marketId;el.title=label;return el;
}

export function decorateFooter(doc:Document,language:Language,markets:Market[],onMarket:(id:string)=>void,onCategory:(id:CategoryId)=>void) {
  const footer=doc.getElementById('atlas-enhanced-footer');if(!footer)return;
  const liveFooter=footer as HTMLElement & {atlasMarkets?:Market[];atlasOpen?:(id:string)=>void;atlasCategory?:(id:CategoryId)=>void};
  liveFooter.atlasMarkets=markets;liveFooter.atlasOpen=onMarket;
  liveFooter.atlasCategory=onCategory;
  const popular=distinctEvents(markets.filter(m=>/finance|econom|business|oil|ipo|stock|fed|gold|treasury/i.test(`${m.category} ${m.title}`)),12);
  const all=distinctEvents([...popular,...markets],12);
  const newFinance=distinctEvents([...markets].sort((a,b)=>b.startTime-a.startTime),12);
  const signature=`${language}|${all.map(m=>m.id).join(',')}|${newFinance.map(m=>m.id).join(',')}`;
  if(footer.dataset.atlasFooterSignature===signature)return;
  footer.dataset.atlasFooterSignature=signature;
  footer.innerHTML=`<div class="atlas-rich-footer-wrap"><div class="atlas-rich-brand"><div class="atlas-rich-logo">A</div><div><strong>MITMARKET</strong><p>Independent Prediction Market Intelligence</p></div></div><div class="atlas-rich-cols"><section class="atlas-rich-topics"><h3>Related topics</h3><div data-rich="topics"></div></section><section><h3>Popular market questions</h3><div data-rich="popular"></div><button class="atlas-rich-more" data-footer-action="trending">Explore more <span>↗</span></button></section><section><h3>New market questions</h3><div data-rich="new"></div><button class="atlas-rich-more" data-footer-action="explore">View all <span>↗</span></button></section></div><div class="atlas-rich-bottom"><div><strong>MITMARKET</strong><span>Live public market data · ${new Date().getFullYear()}</span></div><span>Informational market view only. Orders are not enabled.</span><div><a href="https://docs.polymarket.com/" target="_blank" rel="noopener noreferrer">Market Data API ↗</a><a href="https://polymarket.com/" target="_blank" rel="noopener noreferrer">Data source ↗</a></div></div></div>`;
  const topics=footer.querySelector('[data-rich="topics"]');
  for(const topic of popularTopics){const el=doc.createElement('button');el.type='button';el.className='atlas-rich-topic';el.dataset.footerTopic=topic;el.innerHTML='<strong></strong><small>Prediction markets &amp; odds</small>';el.querySelector('strong')!.textContent=topic;topics?.appendChild(el);}
  for(const [selector,list] of [['popular',all],['new',newFinance]] as const){const holder=footer.querySelector(`[data-rich="${selector}"]`);for(const m of list){holder?.appendChild(button(doc,m.title,m.id));}}
  if(!footer.dataset.atlasRichEvents){
    footer.dataset.atlasRichEvents='1';
    footer.addEventListener('click',event=>{
      const target=event.target as HTMLElement;
      const marketId=target.closest<HTMLElement>('[data-footer-market]')?.dataset.footerMarket;
      if(marketId){event.preventDefault();liveFooter.atlasOpen?.(marketId);return;}
      const topic=target.closest<HTMLElement>('[data-footer-topic]')?.dataset.footerTopic;
      if(topic){event.preventDefault();const chosen=categories.find(c=>c.label.toLowerCase()===topic.toLowerCase());if(chosen)liveFooter.atlasCategory?.(chosen.id);}
    });
  }
  if(!doc.getElementById('atlas-rich-footer-style')){
    const style=doc.createElement('style');style.id='atlas-rich-footer-style';
    style.textContent=`#atlas-enhanced-footer{background:#000!important;border:0!important;padding:68px 28px 40px!important;margin:0!important;color:#F4F6FA!important}#atlas-enhanced-footer .atlas-rich-footer-wrap{max-width:1410px;margin:auto;font-family:'DM Sans',Inter,ui-sans-serif,sans-serif}#atlas-enhanced-footer .atlas-rich-brand{display:flex;align-items:center;gap:12px;margin-bottom:44px}#atlas-enhanced-footer .atlas-rich-logo{display:grid;place-items:center;background:#1463ff;color:#000;border-radius:8px;width:37px;height:37px;font-size:23px;font-weight:800}#atlas-enhanced-footer .atlas-rich-brand strong{font-family:Manrope,'DM Sans',sans-serif;font-weight:800;letter-spacing:1.4px;font-size:23px}#atlas-enhanced-footer .atlas-rich-brand p{margin:2px 0 0;color:#98A5B5;font-size:12px}#atlas-enhanced-footer .atlas-rich-cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:55px}#atlas-enhanced-footer .atlas-rich-cols section{min-width:0}#atlas-enhanced-footer .atlas-rich-cols h3{margin:0 0 22px;color:#F4F6FA;font-weight:700;font-size:15px}#atlas-enhanced-footer .atlas-rich-cols [data-rich]{display:flex;flex-direction:column;gap:12px}#atlas-enhanced-footer .atlas-rich-cols button{padding:0;border:0;background:none;color:#F4F6FA;text-align:left;cursor:pointer;line-height:1.35;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}#atlas-enhanced-footer .atlas-rich-cols button:hover{color:#EAA343}#atlas-enhanced-footer .atlas-rich-topic{display:flex!important;flex-direction:column;gap:2px}#atlas-enhanced-footer .atlas-rich-topic strong{font-size:13px;font-weight:650}#atlas-enhanced-footer .atlas-rich-topic small{color:#98A5B5;font-size:11px;font-weight:450}#atlas-enhanced-footer .atlas-rich-cols button.atlas-rich-more{display:flex;gap:9px;margin-top:23px;color:#98A5B5;font-size:13px}#atlas-enhanced-footer .atlas-rich-bottom{padding-top:60px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;color:#98A5B5;font-size:11px}#atlas-enhanced-footer .atlas-rich-bottom div{display:flex;gap:12px;align-items:center}#atlas-enhanced-footer .atlas-rich-bottom strong{color:#F4F6FA;font-size:14px}#atlas-enhanced-footer .atlas-rich-bottom a{font-size:11px;color:#98A5B5;text-decoration:none}#atlas-enhanced-footer .atlas-rich-bottom a:hover{color:#EAA343}@media(max-width:800px){#atlas-enhanced-footer{padding:42px 17px 105px!important}#atlas-enhanced-footer .atlas-rich-cols{grid-template-columns:repeat(2,minmax(0,1fr));gap:30px 22px}#atlas-enhanced-footer .atlas-rich-topics{grid-column:1/-1}#atlas-enhanced-footer .atlas-rich-topics [data-rich]{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}#atlas-enhanced-footer .atlas-rich-cols button{font-size:12px}#atlas-enhanced-footer .atlas-rich-bottom{padding-top:42px;flex-direction:column;align-items:flex-start}}@media(max-width:420px){#atlas-enhanced-footer .atlas-rich-cols{grid-template-columns:1fr}#atlas-enhanced-footer .atlas-rich-topics{grid-column:auto}}`;
    doc.head.appendChild(style);
  }
}
