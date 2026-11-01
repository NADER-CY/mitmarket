import catalog from './data/sports-catalog.json';
import type {Market} from './marketCatalog';
export const sportsCatalog=catalog;
const entries=[...catalog.pinned,...catalog.groups,...catalog.groups.flatMap(group=>group.children)];
export const sportsEntry=(key:string)=>entries.find(item=>item.key===key||item.label===key);
export const sportsLabel=(key:string)=>key==='Live'||key==='Futures'?key:sportsEntry(key)?.label||'Sports';
export const sportsTopics=[...catalog.pinned,...catalog.groups].map(item=>item.label);
export function sportsQuery(topic:string){if(topic==='All')return{tags:['1'],live:false,futures:false};if(topic==='Live')return{tags:['1'],live:true,futures:false};if(topic==='Futures')return{tags:['1'],live:false,futures:true};const entry=sportsEntry(topic);if(!entry)throw Error('Unknown sports category');return{tags:entry.tagIds,live:false,futures:false};}
export function sportsTopicMatches(m:Market,topic:string){const entry=sportsEntry(topic);if(!entry)return false;const names=[entry.label,entry.key.replace('family:','')].map(x=>x.toLowerCase().replace(/[^a-z0-9]+/g,''));return(m.tags||[]).some(tag=>names.includes(tag.toLowerCase().replace(/[^a-z0-9]+/g,'')));}
// Futures and fixtures stay separate; live status comes from the provider.
export function sportsEventMatches(event:{live?:boolean;ended?:boolean;tags?:{id?:string|number;slug?:string;label?:string}[]},topic:string){const game=(event.tags||[]).some(tag=>String(tag.id)==='100639'||tag.slug==='games');if(topic==='Futures')return !game;if(topic==='Live')return game&&event.live===true&&event.ended!==true;return game;}
