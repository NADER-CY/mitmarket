import {readFileSync} from 'node:fs';
import ts from 'typescript';
import test from 'node:test';
import assert from 'node:assert/strict';
const code=ts.transpileModule(readFileSync(new URL('../../src/marketTokens.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {parseMarketTokens,resolveMarketTokens,cachedMarketTokens}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('parses native token IDs without accepting malformed metadata',()=>{assert.deepEqual(parseMarketTokens('["123","456"]'),['123','456']);assert.deepEqual(parseMarketTokens('bad'),[]);assert.deepEqual(parseMarketTokens([null,'invalid',42]),[]);});
test('history uses native clob IDs rather than wrapped combo position IDs',async()=>{const old=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return{ok:true,json:async()=>({clobTokenIds:'["123","456"]',positionIds:['999','998']})};};try{const [a,b]=await Promise.all([resolveMarketTokens('test-market'),resolveMarketTokens('test-market')]);assert.deepEqual(a,['123','456']);assert.deepEqual(b,a);assert.equal(calls,1);assert.deepEqual(cachedMarketTokens('test-market'),a);}finally{globalThis.fetch=old;}});
