import type {Market} from './marketCatalog';
// The sidebar totals are a dated provider snapshot, measured in events.
export const geopoliticsCatalog=[{label:'All',count:791},{label:'Iran',count:148},{label:'Lebanon',count:15},{label:'Oil',count:60},{label:'Ukraine',count:57},{label:'Ukraine Map',count:63},{label:'Cuba',count:13},{label:'Venezuela',count:26},{label:'Middle East',count:143},{label:'Gaza',count:15},{label:'Israel',count:130},{label:'Syria',count:11},{label:'Yemen',count:44},{label:'Turkey',count:13},{label:'Sudan',count:1},{label:'China',count:49},{label:'India-Pakistan',count:3}];
export const geopoliticsTopics=geopoliticsCatalog.slice(1).map(x=>x.label);
export const geopoliticsTotal=(topic:string)=>geopoliticsCatalog.find(x=>x.label===topic)?.count??0;
const norm=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,'');
export function geopoliticsMatches(m:Market,topic:string){if(topic==='All')return true;const key=norm(topic);return (m.tags||[]).some(tag=>norm(tag)===key);}
