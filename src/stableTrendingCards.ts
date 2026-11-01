/** Preserve the first visible ordering while live catalog batches arrive. */
export function appendStableOrder<T>(items:T[],order:string[],key:(item:T)=>string,limit=Infinity):T[]{
 const known=new Set(order);
 for(const item of items){const id=key(item);if(!known.has(id)){order.push(id);known.add(id);}}
 const buckets=new Map<string,T[]>();
 for(const item of items){const id=key(item),bucket=buckets.get(id);if(bucket)bucket.push(item);else buckets.set(id,[item]);}
 const result:T[]=[];
 for(const id of order){const bucket=buckets.get(id);if(!bucket)continue;for(const item of bucket){if(result.length>=limit)return result;result.push(item);}}
 return result;
}
