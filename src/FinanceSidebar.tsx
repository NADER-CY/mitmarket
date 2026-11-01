import {financeTimes,financeTopics} from './financeCatalog';
const paths:Record<string,string>={
 All:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
 '15 Min':'M12 6v6l4 3M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20',
 Daily:'M3 6h18v15H3zM7 3v6M17 3v6M3 11h18M7 15h3',
 Weekly:'M4 20V12h3v8M10 20V7h3v13M16 20V4h3v16',
 Monthly:'m3 18 5-6 4 3 8-10M17 5h3v3',
 Stocks:'M3 19h18M4 16l4-5 4 3 7-8M16 6h3v3',
 Earnings:'M4 19V8l8-5 8 5v11M8 19v-6h8v6M3 20h18M10 8h4',
 Indices:'M4 19V9h3v10M10 19V5h3v14M16 19v-7h3v7M2 20h20',
 Commodities:'M4 17h16l-2 3H6zM6 12h12l-2 4H8zM8 7h8l-1 4H9z',
 Forex:'M4 7h14m-3-3 3 3-3 3M20 17H6m3-3-3 3 3 3',
 Privates:'M5 10V7a7 7 0 0 1 14 0v3M4 10h16v11H4zM12 14v3',
 Acquisitions:'M3 9l4-4 5 2 5-2 4 4-3 3-5-3-4 3-3-2-3 3M7 14l5 5 2-2M10 16l4 3 2-2M14 14l3 2 2-2',
 'Earnings Calendar':'M3 6h18v15H3zM7 3v6M17 3v6M3 11h18M7 15h3M14 15h3',
 IPOs:'M5 19 14 4l6 1 1 6-15 9-1-1ZM14 4l6 6M10 15l3-3M5 15l-2 2 2 2M16 19l2 2 2-2',
 'Fed Rates':'M5 19 19 5M7 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm10 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
 'Prediction Markets':'M12 3a9 9 0 1 0 9 9M12 3v9l6 3M16 3h5v5M21 3l-6 6',
 Treasuries:'M5 3h14v18l-7-3-7 3V3ZM9 8h6M9 12h6',
 KPIs:'M3 20h18M5 18v-5h3v5M10 18V9h3v9M15 18V5h3v13',
};
function FinanceIcon({name}:{name:string}){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]||paths.All}/></svg>;}
export function FinanceSidebar({selected,onSelect}:{selected:string;onSelect:(topic:string)=>void}){return <aside className="cr-side mit-finance-side" aria-label="Finance categories"><style>{`.mit-finance-side{padding:0 14px 20px!important;background:transparent!important;border:0!important;position:static!important;max-height:none!important;overflow:visible!important}.mit-finance-side nav{display:flex;flex-direction:column}.mit-finance-side button{display:flex;align-items:center;justify-content:flex-start!important;width:100%;gap:10px;min-height:42px;padding:8px 12px;border:0;border-radius:8px;background:transparent;color:#bfc2cb;font:600 13px Inter,Arial,sans-serif;text-align:left;cursor:pointer}.mit-finance-side button.on{background:#292c33;color:#fff}.mit-finance-side button:hover{color:#eaa343}.mit-finance-side .finance-icon{width:20px;height:20px;flex:0 0 20px;display:grid;place-items:center;font-size:17px;line-height:1;color:#c7cbd4}.mit-finance-side .finance-icon svg{width:20px;height:20px;display:block}.mit-finance-side .finance-icon.color{color:#a99ae7}.mit-finance-side .finance-label{flex:1;min-width:0;text-align:left}.mit-finance-side small{margin-left:auto;color:#969ca8;font-size:10px}.mit-finance-divider{border-top:1px solid #30343d;margin:8px 0}@media(max-width:760px){.mit-finance-side{display:block!important}.mit-finance-side nav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.mit-finance-divider{grid-column:1/-1}}`}</style><nav>{[...financeTimes,...financeTopics].map((name,index)=><div key={name}>{index===financeTimes.length&&<div className="mit-finance-divider"/>}<button className={selected===name?'on':''} aria-pressed={selected===name} onClick={()=>onSelect(name)}><span className={`finance-icon ${index>=5&&index<10?'color':''}`} aria-hidden="true"><FinanceIcon name={name}/></span><span className="finance-label">{name}</span>{name==='All'&&<small title="Polymarket navigation snapshot, 26 October 2026">754</small>}</button></div>)}</nav></aside>}
