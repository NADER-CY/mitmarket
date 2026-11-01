export type HomeCardVariant='regular'|'wide'|'chart'|'full'|'vertical';
const limits:Record<string,number>={crypto:6,sports:7,politics:8,elections:4,finance:5,economy:4,geopolitics:6,technology:5,tech:5,culture:4,weather:4,markets:5,esports:3,iran:1,mentions:3,art:2};
export function homeCategoryLimit(category:string){return limits[category.toLowerCase()]??4;}
/** Complete rows in the original four-column mosaic; no invented cards. */
export function homeCategoryLayout(count:number,portrait:boolean):HomeCardVariant[]{
 const plans:Record<number,HomeCardVariant[]>={
  1:['full'],2:['chart','chart'],3:['chart','regular','regular'],4:['regular','regular','regular','regular'],
  5:['chart','regular','regular','wide','wide'],
  6:['chart','regular','regular','regular','regular','wide'],
  7:['chart','regular','regular','regular','regular','regular','regular'],
  8:portrait?['vertical','chart','regular','regular','regular','regular','wide','wide']:['chart','regular','regular','regular','regular','wide','wide','wide']
 };
 return plans[count]??[];
}
