import {readFileSync} from 'node:fs';
import ts from 'typescript';
import test from 'node:test';
import assert from 'node:assert/strict';
const code=ts.transpileModule(readFileSync(new URL('../../src/quoteStore.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {createQuoteStore}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('a batch updates only affected subscribers once',()=>{const s=createQuoteStore();let a=0,b=0;s.subscribe(['a','c'],()=>a++);s.subscribe(['b'],()=>b++);s.publish(new Map([['a',.4],['c',.6]]));assert.equal(a,1);assert.equal(b,0);assert.equal(s.get('a'),.4);});
test('identical or invalid ticks do not cause renders',()=>{const s=createQuoteStore();let calls=0;s.subscribe(['a'],()=>calls++);s.publish(new Map([['a',.5]]));const revision=s.revision(['a']);for(const value of [.5,NaN,2,-1])s.publish(new Map([['a',value]]));assert.equal(calls,1);assert.equal(s.revision(['a']),revision);});
test('unmounted cards stop receiving updates',()=>{const s=createQuoteStore();let calls=0;const stop=s.subscribe(['a'],()=>calls++);stop();s.publish(new Map([['a',.7]]));assert.equal(calls,0);});
