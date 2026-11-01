/** A shared desktop-only appearance for previous/next navigation controls. */
export function installDesktopArrowStyle(doc:Document){
 if(doc.getElementById('mit-desktop-plain-arrows'))return;
 const style=doc.createElement('style');style.id='mit-desktop-plain-arrows';
 style.textContent=`button.mit-plain-arrow,a.mit-plain-arrow,button[aria-label^="Previous"],button[aria-label^="Next"],button[aria-label^="previous"],button[aria-label^="next"]{background:transparent!important;background-image:none!important;border:0!important;border-radius:0!important;box-shadow:none!important}button.mit-plain-arrow::before,button.mit-plain-arrow::after{border:0!important;background:none!important;box-shadow:none!important}`;
 doc.head.appendChild(style);
 const mark=(root:Element)=>{const controls=root.matches('button,a[role="button"]')?[root]:[...root.querySelectorAll('button,a[role="button"]')];for(const control of controls){const label=(control.getAttribute('aria-label')||control.getAttribute('title')||'').trim();const text=control.textContent?.trim()||'';if(/^(previous|next)\b/i.test(label)||/^(‹|›|❮|❯|←|→|chevron_left|chevron_right|arrow_back_ios|arrow_forward_ios)$/.test(text))control.classList.add('mit-plain-arrow');}};
 if(doc.body)mark(doc.body);
 const observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)mark(node as Element);});
 if(doc.body)observer.observe(doc.body,{childList:true,subtree:true});
 doc.defaultView?.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
}
