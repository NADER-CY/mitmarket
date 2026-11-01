const paths:Record<string,string>={
 crypto:'M10 3v18M14 3v18M7 6h7a3 3 0 0 1 0 6H7m0 0h8a3 3 0 0 1 0 6H7M7 5v14',
 sports:'M7 3h10v7a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 15v5m-4 1h8',
 politics:'m3 8 9-5 9 5H3Zm2 3v7m5-7v7m4-7v7m5-7v7M3 21h18',
 elections:'m8 6 4-3 5 5-4 4M6 10H3v11h18V10h-4M8 14h8',
 finance:'M4 20V10m5 10V4m6 16v-7m5 7V7',
 economy:'M3 20h18M5 17v-5m7 5V7m7 10V3M4 8l6-4 5 4 6-6',
 geopolitics:'M3 12h18M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c-5 5-5 13 0 18 5-5 5-13 0-18',
 technology:'M7 7h10v10H7V7Zm3 3h4v4h-4M9 3v4m6-4v4M9 17v4m6-4v4M3 9h4m-4 6h4m10-6h4m-4 6h4',
 culture:'m4 4 8 2 8-2v9c0 5-8 8-8 8s-8-3-8-8V4Zm3 6h2m6 0h2m-9 5q4 4 8 0',
 weather:'M7 4v2m-5 5h2m1-7 1 1m6-1-1 1M8 8a4 4 0 0 0-3 7m4 5h10a4 4 0 0 0 0-8 6 6 0 0 0-11 2 3 3 0 0 0 1 6',
 esports:'M7 7h10c3 0 5 10 3 11-2 1-4-3-5-3H9c-1 0-3 4-5 3C2 17 4 7 7 7Zm0 3v4m-2-2h4m6-1h.1m3 2h.1',
 mentions:'M4 4h16v12H9l-5 4V4Zm4 4h8m-8 4h5',
 art:'M12 3a9 9 0 1 0 0 18h1c3 0 3-3 1-4-2-1-1-4 2-4h2c5 0 1-10-6-10ZM7 9h.1M11 6h.1M16 8h.1M6 14h.1',
 iran:'M4 21V3m0 1h16v12H4m0-8h16m-16 4h16'
};
export function categoryDestination(label:string){const key=label.toLowerCase();return key==='tech'?'technology':key==='markets'?'all':key==='business'?'finance':key;}
export function CategorySymbol({category}:{category:string}){const key=categoryDestination(category);return <svg className="trending-category-symbol" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[key]||paths.geopolitics}/></svg>;}
