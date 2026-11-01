import {useCallback,useMemo,useSyncExternalStore,type ReactNode} from 'react';
import {liveQuotes} from './quoteStore';
import type {Market} from './marketCatalog';
export function useQuoteRevision(ids:string[]){const key=ids.filter(Boolean).join(',');const tokens=useMemo(()=>key?key.split(','):[],[key]);const subscribe=useCallback((listener:()=>void)=>liveQuotes.subscribe(tokens,listener),[tokens]);const snapshot=useCallback(()=>liveQuotes.revision(tokens),[tokens]);return useSyncExternalStore(subscribe,snapshot,()=>0);}
export function useQuotedMarkets(markets:Market[]){const revision=useQuoteRevision(markets.flatMap(m=>m.tokenIds));return useMemo(()=>markets.map(m=>({...m,prices:m.prices.map((price,i)=>liveQuotes.get(m.tokenIds[i])??price)})),[markets,revision]);}
export function QuoteMarket({market,children}:{market:Market;children:(market:Market)=>ReactNode}){const rows=useMemo(()=>[market],[market]);const live=useQuotedMarkets(rows)[0];return children(live);}
export function CardQuote<T extends {token?:string;noToken?:string;yes:number|null;no:number|null}>({card,children}:{card:T;children:(card:T)=>ReactNode}){useQuoteRevision([card.token||'',card.noToken||'']);return children({...card,yes:card.token?liveQuotes.get(card.token)??card.yes:card.yes,no:card.noToken?liveQuotes.get(card.noToken)??card.no:card.no});}
