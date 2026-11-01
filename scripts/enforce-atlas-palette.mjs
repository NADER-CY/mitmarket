import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Current owner-approved palette; mechanical color-only migration.
const groups = {
  '#000000':['#0a1420','#050f1a','#002664','#002c72','#0040a0','#001847','#003027','#00382d','#005142','#002019','#653e00','#472a00','#2a1700','#690005'],
  '#101216':['#121c28','#16202d','#212b37','#2c3543','#27313e','#101014','#131317','#a36701','#93000a'],
  '#29313D':['#303a47','#424655'],
  '#F4F6FA':['#d9e3f4','#fffbff'],
  '#98A5B5':['#c2c6d7','#8c90a0','#9ba5b5'],
  '#1463ff':['#b1c5ff','#5a8cff','#dae2ff','#0056d0','#3378ff','#3d6bff','#5865f2'],
  '#0bba74':['#50dcbc','#71f9d8','#00a388','#16b89a','#26c4d6','#30bdd0'],
  '#ff4761':['#ffb4ab','#ffdad6','#f05a70'],
  '#EAA343':['#ffb95e','#ffddb8'],
};
const colors=new Map(Object.entries(groups).flatMap(([value,aliases])=>aliases.map(alias=>[alias,value])));

const root = join(process.cwd(), 'public/stitch/stitch_atlas_prediction_market_platform');
const dirs = (await readdir(root, { withFileTypes: true })).filter(dir => dir.isDirectory());
let changed = 0;
for (const dir of dirs) {
  const path = join(root, dir.name, 'code.html');
  let before;
  try { before = await readFile(path, 'utf8'); } catch { continue; }
  const after = before.replace(/#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?\b/g, match => (colors.get(match.slice(0,7).toLowerCase())??match.slice(0,7))+match.slice(7));
  if (after !== before) { await writeFile(path, after); changed++; }
}
for(const entry of await readdir('src')){
  if(!/\.(css|tsx|ts)$/.test(entry))continue;
  const path=join('src',entry);
  const before=await readFile(path,'utf8');
  const after=before.replace(/#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?\b/g,match=>(colors.get(match.slice(0,7).toLowerCase())??match.slice(0,7))+match.slice(7));
  if(before!==after){await writeFile(path,after);changed++;}
}
console.log(`ATLAS palette applied to ${changed} UI files.`);
