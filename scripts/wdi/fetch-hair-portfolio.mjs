#!/usr/bin/env node
// Public-media-only discovery. No credentials, no private endpoints, no writes to the salon.
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';

const OUT=path.resolve('hair-work-candidates');
await mkdir(OUT,{recursive:true});
const endpoints=[
  'https://salon-bw.pl/api/gallery?limit=24',
  'https://www.salon-bw.pl/api/gallery?limit=24',
  'https://salon-bw.pl/gallery',
  'https://www.salon-bw.pl/gallery'
];
function validMediaUrl(raw){
 try {
  const u=new URL(raw);
  return u.protocol==='https:' &&
    (u.hostname==='cdninstagram.com' || u.hostname.endsWith('.cdninstagram.com') ||
     u.hostname==='fbcdn.net' || u.hostname.endsWith('.fbcdn.net') ||
     u.hostname==='instagram.com' || u.hostname.endsWith('.instagram.com'));
 } catch {return false;}
}
async function request(url){
 const res=await fetch(url,{redirect:'follow',headers:{'User-Agent':'SalonBW-WDI-PublicMediaAudit/1.0'},signal:AbortSignal.timeout(18000)});
 if(!res.ok) throw Error('HTTP '+res.status);
 return res;
}
let choices=[];const evidence=[];
for(const url of endpoints) {
 try{
  const r=await request(url);
  const body=await r.text();
  let data;
  if(url.includes('/api/'))data=JSON.parse(body);
  else {
    const m=body.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if(!m)throw Error('No safe server-rendered gallery payload');
    data=JSON.parse(m[1]).props?.pageProps || {};
  }
  const list=Array.isArray(data.items)?data.items:[];
  const valid=list.filter(i=>i && i.type!=='VIDEO' && validMediaUrl(i.imageUrl));
  evidence.push({endpoint:url,mediaCount:list.length,validImages:valid.length,fallback:!!data.fallback});
  if(valid.length>choices.length)choices=valid;
 }catch(e){evidence.push({endpoint:url,error:String(e).slice(0,120)})}
}
const images=[];
for(const entry of choices.slice(0,18)){
 try{
  const r=await request(entry.imageUrl);
  const type=(r.headers.get('content-type')||'').split(';')[0].toLowerCase();
  if(!['image/jpeg','image/webp','image/png'].includes(type))throw Error('Unexpected content type');
  const bytes=Buffer.from(await r.arrayBuffer());
  if(!bytes.length || bytes.length>9_000_000) throw Error('Image size outside bounds');
  const ext=type==='image/jpeg'?'jpg':type==='image/png'?'png':'webp';
  const name='work-'+String(images.length+1).padStart(2,'0')+'.'+ext;
  await writeFile(path.join(OUT,name),bytes);
  images.push({file:name,id:String(entry.id),caption:typeof entry.caption==='string'?entry.caption.slice(0,280):'',bytes:bytes.length,format:type,source:'public Instagram-backed salon gallery'});
 }catch(e){evidence.push({mediaId:String(entry.id),downloadError:String(e).slice(0,100)})}
}
await writeFile(path.join(OUT,'manifest.json'),JSON.stringify({source:'SalonBW public gallery only',images,evidence},null,2)+'\n');
console.log(JSON.stringify({downloaded:images.length,evidence,files:images.map(x=>x.file)}));
if(!images.length)process.exitCode=2;
