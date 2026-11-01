import catalog from './data/politics-catalog.json';
import type {Market} from './marketCatalog';
export const politicsCatalog=catalog;
export const politicsTopics=catalog.items.filter(item=>item.label!=='All').map(item=>item.label);
export const politicsTagId=(topic:string)=>catalog.items.find(item=>item.label===topic)?.id||catalog.items[0].id;
export const politicsTotal=(topic='All')=>catalog.items.find(item=>item.label===topic)?.count??0;
const normalize=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,'');
export function politicsTopicMatches(m:Market,topic:string){if(topic==='All')return true;const entry=catalog.items.find(item=>item.label===topic);if(!entry)return false;const names=[entry.label,entry.scope||''].map(normalize).filter(Boolean);return(m.tags||[]).some(tag=>names.includes(normalize(tag)));}
