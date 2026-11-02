// Identical selection policy used by desktop and mobile crypto slides.
export function selectFeaturedCrypto<T extends {id:string;title:string;endDate?:string;volume?:number}>(markets:T[]):T[]{
 const open=markets.filter(m=>(!m.endDate||Date.parse(m.endDate)>Date.now())&&/up or down/i.test(m.title));
 open.sort((a,b)=>Number(/bitcoin/i.test(b.title))-Number(/bitcoin/i.test(a.title))||(b.volume||0)-(a.volume||0)||a.id.localeCompare(b.id));
 return open.slice(0,1);
}
