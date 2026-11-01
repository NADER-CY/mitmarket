import test from 'node:test';
import assert from 'node:assert/strict';
import {extractComboCounts,labels} from '../refresh-combo-counts.mjs';
const html=counts=>{const nav=[{items:[{label:'All',count:counts.All}]},{label:'Sports',items:labels.map(label=>({label,count:counts[label],children:[{label:'overlapping child',count:900}]}))}];const flight='1:'+JSON.stringify({state:{data:nav},queryKey:['combosNav']})+'\n';return '<script>self.__next_f.push('+JSON.stringify([1,flight])+')</script>';};
test('reads full provider totals without counting nested leagues twice',()=>{const counts=Object.fromEntries(labels.map((label,i)=>[label,i+1]));counts.All=labels.reduce((sum,label)=>sum+counts[label],0);assert.deepEqual(extractComboCounts(html(counts)),{All:counts.All,...Object.fromEntries(labels.map(label=>[label,counts[label]]))});});
test('refuses incomplete or inconsistent totals instead of using loaded cards',()=>{const counts=Object.fromEntries(labels.map(label=>[label,1]));counts.All=500;assert.throws(()=>extractComboCounts(html(counts)),/reconcile/);assert.throws(()=>extractComboCounts('<html/>'),/unavailable/);});
