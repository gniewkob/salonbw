#!/usr/bin/env node
// Convert an already verified public-only gallery artifact to stable first-party project assets.
// No Instagram token, no network request, no private data, no file outside selected path.
import {mkdir, writeFile, readFile} from 'node:fs/promises';
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
const source=path.resolve('hair-work-candidates');
const raw=JSON.parse(await readFile(path.join(source,'manifest.json'),'utf8'));
if(raw.source!=='SalonBW public gallery only' || !Array.isArray(raw.images))
 throw Error('Incorrect source provenance');
const sourceById=new Map(raw.images.map(i=>[String(i.id),i]));
const dir=path.join('apps','landing','public','images','hair-portfolio');
await mkdir(dir,{recursive:true});
const manifest=[];
for(const entry of selection){
 const item=sourceById.get(entry.id);
 if(!item || !/^work-\d{2}\.jpg$/.test(item.file)||item.format!=='image/jpeg')
  throw Error('Approved photo not found in verified source: '+entry.id);
 const bytes=await readFile(path.join(source,item.file));
 if(bytes.length<30_000 || bytes.length>8_000_000 || bytes[0]!==0xff || bytes[1]!==0xd8 || bytes[2]!==0xff)
  throw Error('Invalid JPEG: '+entry.id);
 await writeFile(path.join(dir,entry.file),bytes);
 manifest.push({...entry,sha256:createHash('sha256').update(bytes).digest('hex'),size:bytes.length,
  source:'https://www.instagram.com/salon_bw/',type:'public-owner-approved-instagram-work'});
}
await writeFile(path.join(dir,'selection.json'),JSON.stringify({
 version:1,
 provenance:'Public SalonBW gallery via Instagram API; user approved reuse for website DEV',
 sourceArtifact:'GitHub Actions #41930152498 public-only photo audit',
 images:manifest},null,2)+'\n');
console.log('Imported',manifest.length,'first-party verified portfolio images:',manifest.map(i=>i.file).join(', '));
