/** One navigation-arrow size throughout the desktop site, matching the menu chevrons. */
export function installDesktopArrowStyle(doc:Document){
 if(doc.getElementById('mit-desktop-plain-arrows'))return;
 const style=doc.createElement('style');style.id='mit-desktop-plain-arrows';
 style.textContent=`:root{--mit-navigation-arrow-size:16px}button.mit-plain-arrow,a.mit-plain-arrow,button[aria-label^="Previous"],button[aria-label^="Next"],button[aria-label^="previous"],button[aria-label^="next"]{background:transparent!important;background-image:none!important;border:0!important;border-radius:0!important;box-shadow:none!important;font-size:22px!important;line-height:1!important}button.mit-plain-arrow::before,button.mit-plain-arrow::after{border:0!important;background:none!important;box-shadow:none!important}button.mit-plain-arrow svg,a.mit-plain-arrow svg,button[aria-label^="Previous"] svg,button[aria-label^="Next"] svg{width:var(--mit-navigation-arrow-size)!important;height:var(--mit-navigation-arrow-size)!important;min-width:var(--mit-navigation-arrow-size)!important;min-height:var(--mit-navigation-arrow-size)!important}.trending-topics-arrow,.mms-hero-arrows button{font-size:22px!important;line-height:1!important}.trending-topics-arrow svg,.mms-hero-arrows svg{width:var(--mit-navigation-arrow-size)!important;height:var(--mit-navigation-arrow-size)!important}`;
 doc.head.appendChild(style);
 const mark=(root:Element)=>{const controls=root.matches('button,a[role="button"]')?[root]:[...root.querySelectorAll('button,a[role="button"]')];for(const control of controls){const label=(control.getAttribute('aria-label')||control.getAttribute('title')||'').trim();const text=control.textContent?.trim()||'';if(/^(previous|next|scroll left|scroll right|slide left|slide right|carousel previous|carousel next)\b/i.test(label)||/^(‹|›|❮|❯|←|→|〈|〉|chevron_left|chevron_right|arrow_back_ios|arrow_forward_ios)$/.test(text))control.classList.add('mit-plain-arrow');}};
 if(doc.body)mark(doc.body);
 const observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)mark(node as Element);});
 if(doc.body)observer.observe(doc.body,{childList:true,subtree:true});
 doc.defaultView?.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
}
