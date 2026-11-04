#!/usr/bin/env node
// Import ONLY explicitly approved, published SalonBW images into first-party DEV assets.
// No Instagram token, no private source, no content mutation, no remote CDN at runtime.
import {mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

const selection=[
 {id:'18068849099771268',file:'copper-waves.jpg',alt:'Miedziana koloryzacja włosów z miękkimi falami',label:'Miedź i światło'},
 {id:'18098153141531989',file:'cool-blonde.jpg',alt:'Chłodny blond z wielowymiarowymi refleksami i falami',label:'Chłodny blond'},
 {id:'17917131675452190',file:'textured-updo.jpg',alt:'Teksturowane eleganckie upięcie włosów',label:'Upięcie z charakterem'},
 {id:'18100405939504766',file:'soft-blonde.jpg',alt:'Jasne, gładkie włosy po koloryzacji blond',label:'Świetlisty blond'},
 {id:'17888029017205520',file:'blonde-waves.jpg',alt:'Długie blond włosy ułożone w miękkie fale',label:'Blond i ruch'},
 {id:'17942636783816961',file:'formal-updo.jpg',alt:'Eleganckie blond upięcie z subtelnymi ozdobami',label:'Forma i detal'},
 {id:'18473069806033350',file:'blonde-shine.jpg',alt:'Blond włosy o gładkim, lśniącym wykończeniu',label:'Precyzja koloru'}
];
function allowedMedia(url){
 try{
  const u=new URL(url);
  return u.protocol==='https:' &&
    (['cdninstagram.com','fbcdn.net','instagram.com'].includes(u.hostname) ||
     ['.cdninstagram.com','.fbcdn.net','.instagram.com'].some(s=>u.hostname.endsWith(s)));
 }catch{return false;}
}
const url='https://salon-bw.pl/api/gallery?limit=36';
const result=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(18000)});
if(!result.ok)throw Error('Published gallery HTTP '+result.status);
const body=await result.json();
if(body.fallback || !Array.isArray(body.items))throw Error('Public gallery is unavailable; no assets changed');
const map=new Map(body.items.filter(x=>x && x.id && x.type!=='VIDEO').map(x=>[String(x.id),x]));
const dir=path.join('apps','landing','public','images','hair-portfolio');
await mkdir(dir,{recursive:true});
const manifest=[];
for(const entry of selection){
 const item=map.get(entry.id);
 if(!item || !allowedMedia(item.imageUrl))throw Error('Approved image missing from public gallery: '+entry.id);
 const res=await fetch(item.imageUrl,{signal:AbortSignal.timeout(18000)});
 if(!res.ok)throw Error('Published media HTTP '+res.status+' for '+entry.id);
 if(!(res.headers.get('content-type')||'').startsWith('image/jpeg'))throw Error('Unexpected source image type: '+entry.id);
 const bytes=Buffer.from(await res.arrayBuffer());
 if(bytes.length<30_000 || bytes.length>8_000_000 || bytes[0]!==0xff || bytes[1]!==0xd8 || bytes[2]!==0xff)
  throw Error('Invalid JPEG image: '+entry.id);
 await writeFile(path.join(dir,entry.file),bytes);
 manifest.push({...entry,sha256:createHash('sha256').update(bytes).digest('hex'),size:bytes.length,
  source:'https://www.instagram.com/salon_bw/',type:'public-owner-approved-instagram-work'});
}
await writeFile(path.join(dir,'selection.json'),JSON.stringify({version:1,provenance:'Public salon gallery via Instagram Graph API; user approved reuse for SalonBW DEV',images:manifest},null,2)+'\n');
console.log('Imported',manifest.length,'verified first-party portfolio images:',manifest.map(i=>i.file).join(', '));
