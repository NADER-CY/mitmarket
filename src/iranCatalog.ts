import type {Market} from './marketCatalog';
// Navigation counts are a provider snapshot, not a live contract count.
export const iranCatalog = [
 {label:'All',slug:'iran',count:238},
 {label:'Iran Ceasefire',slug:'diplomacy-ceasefire',count:23},
 {label:'U.S. x Iran',slug:'trump-iran',count:30},
 {label:'Strait of Hormuz',slug:'strait-of-hormuz',count:35},
 {label:'Peace Deal',slug:'peace-deal',count:19},
 {label:'Negotiation Topics',slug:'negotiations',count:5},
 {label:'Oil',slug:'oil',count:60},
 {label:'Israel x Iran',slug:'israel-x-iran',count:23},
 {label:'Lebanon',slug:'lebanon',count:15},
 {label:'Iran Regime',slug:'iranian-leadership-regime',count:19},
 {label:'Nuclear',slug:'nuclear',count:9},
];
export const iranTopics=iranCatalog.slice(1).map(item=>item.label);
export const iranSlug=(topic:string)=>iranCatalog.find(item=>item.label===topic)?.slug||'iran';
export const iranTotal=(topic:string)=>iranCatalog.find(item=>item.label===topic)?.count??0;
const normalize=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,'');
export function iranTopicMatches(m:Market,topic:string){if(topic==='All')return true;const item=iranCatalog.find(i=>i.label===topic);if(!item)return false;return (m.tags||[]).some(tag=>[item.label,item.slug].map(normalize).includes(normalize(tag)));}
