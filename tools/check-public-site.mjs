import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = resolve(process.argv[2] || 'apps/yesterdays-me/site');
const manifest = JSON.parse(readFileSync(join(root,'publication-manifest.json'),'utf8'));
assert.equal(manifest.identityVersion,'2026.10');
const sha = value => createHash('sha256').update(value).digest('hex');
const entries = Object.entries(manifest.files);
for (const [path, hash] of entries) {
 assert(!path.startsWith('/') && !path.split('/').includes('..'),`unsafe export: ${path}`);
 assert.equal(sha(readFileSync(join(root,path))),hash,`publication drift: ${path}`);
 if (!path.endsWith('.html')) continue;
 const html = readFileSync(join(root,path),'utf8');
 assert(html.includes('545-10-02626') && html.includes('versova1128@gmail.com'),`missing public identity: ${path}`);
 assert(!/support@versova\.dev|Versova Holdings|Versova Group|오류 기록|error log/i.test(html),`unsupported public claim: ${path}`);
 assert(html.includes('rel="canonical"') && html.includes('name="viewport"'));
 for (const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  if (/^(?:https?:|mailto:|#)/.test(url)) continue;
  const local = resolve(dirname(join(root,path)),url.split('#')[0]);
  assert(local === root || local.startsWith(root+'/'),`link escapes project site: ${path} ${url}`);
  assert(existsSync(local) && (!statSync(local).isDirectory() || existsSync(join(local,'index.html'))),`broken link: ${path} ${url}`);
 }
}
const actual = [];
function walk(dir,prefix=''){for(const f of readdirSync(dir,{withFileTypes:true})){const p=prefix+f.name;if(f.name === '.git')continue;if(f.isDirectory())walk(join(dir,f.name),p+'/');else actual.push(p)}}
walk(root);
const payload = actual.filter(p=>!['publication-manifest.json','README.md','AGENTS.md','tools/check-public-site.mjs','.github/workflows/verify.yml'].includes(p));
assert.deepEqual(payload.sort(),entries.map(([p])=>p).sort(),'unexpected public payload');
const css = readFileSync(join(root,'assets/brand.css'),'utf8');
const defined = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map(m=>m[1]));
for (const [,v] of css.matchAll(/var\((--[\w-]+)/g)) assert(defined.has(v),`undefined CSS variable ${v}`);
console.log(`Validated ${entries.length} public files: hashes, safe paths, identity, relative links and CSS.`);
