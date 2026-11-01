import {readFileSync} from 'node:fs';
import ts from 'typescript';
import test from 'node:test';
import assert from 'node:assert/strict';
const data=JSON.parse(readFileSync(new URL('../../src/data/sports-catalog.json',import.meta.url),'utf8'));
const source=readFileSync(new URL('../../src/sportsCatalog.ts',import.meta.url),'utf8').replace("import catalog from './data/sports-catalog.json';",'const catalog='+JSON.stringify(data)+';');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {sportsCatalog,sportsQuery,sportsLabel,sportsEventMatches}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('pinned sports and family order match the supplied menu',()=>{assert.deepEqual(sportsCatalog.pinned.map(x=>x.label),['NFL','MLB','College Football','UFC','UEFA Champions League','UNL']);assert.deepEqual(sportsCatalog.groups.map(x=>x.label),['Soccer','Tennis','Cricket','Basketball','Baseball','Football','Hockey','Rugby','Aussie Rules','Table Tennis','Darts','Volleyball','Handball','Golf','Combat','Motorsports','Chess','Esports']);});
test('live and futures use different provider filters',()=>{assert.equal(sportsQuery('Live').live,true);assert.equal(sportsQuery('Futures').live,false);assert.equal(sportsQuery('Futures').futures,true);assert.equal(sportsQuery('nfl').live,false);});
test('league and family filters use metadata IDs without broad fallback',()=>{assert.deepEqual(sportsQuery('nfl').tags,['450']);assert.deepEqual(sportsQuery('ucl').tags,['1234']);assert.ok(sportsQuery('family:soccer').tags.includes('100350'));assert.ok(sportsQuery('family:basketball').tags.includes('745'));assert.ok(!sportsQuery('family:soccer').tags.includes('450'));assert.throws(()=>sportsQuery('unknown'),/Unknown/);});
test('every submenu has a usable provider tag',()=>{for(const group of sportsCatalog.groups){assert.ok(group.tagIds.length);for(const child of group.children){assert.ok(sportsQuery(child.key).tags.length);assert.equal(sportsLabel(child.key),child.label);}}});

test('futures, fixtures and live games cannot leak into one another',()=>{const game={tags:[{id:'100639'}],live:false};assert.equal(sportsEventMatches(game,'nfl'),true);assert.equal(sportsEventMatches(game,'Live'),false);assert.equal(sportsEventMatches(game,'Futures'),false);assert.equal(sportsEventMatches({...game,live:true},'Live'),true);assert.equal(sportsEventMatches({...game,live:true,ended:true},'Live'),false);assert.equal(sportsEventMatches({tags:[{id:'450'}]},'Futures'),true);});
