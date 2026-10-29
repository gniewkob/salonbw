'use strict';
const fs=require('node:fs'),dotenv=require('dotenv'),{Client}=require('pg'),cp=require('node:child_process');
const target='p11522_sbwrestore_40899799418';
if(!/^p11522_sbwrestore_[0-9]{8,12}$/.test(target))throw Error('invalid target');
const e=dotenv.parse(fs.readFileSync('/usr/home/vetternkraft/apps/nodejs/api_salonbw/.env'));
const u=e.DATABASE_URL?new URL(e.DATABASE_URL):null;
const db=u?decodeURIComponent(u.pathname.slice(1)):e.PGDATABASE||e.DB_NAME;
if(!db||db===target||db.endsWith('_d'))throw Error('unsafe source DB identity');
const opts={host:u?.hostname||e.PGHOST||e.DB_HOST,
  port:Number(u?.port||e.PGPORT||e.DB_PORT||5432),
  user:u?decodeURIComponent(u.username):e.PGUSER||e.DB_USER,
  password:u?decodeURIComponent(u.password):e.PGPASSWORD||e.DB_PASS,
  database:db,connectionTimeoutMillis:15000};
(async()=>{
  const client=new Client(opts);
  await client.connect();
  try{
    const exists=async()=>{const r=await client.query('SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname=$1) AS present',[target]);return !!r.rows[0]?.present};
    const before=await exists();
    console.log('ISOLATED_TEMP_DB_PRESENT_BEFORE='+before);
    if(!before){console.log('TEMP_RESTORE_DB_CLEANUP=PASS_ALREADY_ABSENT');return;}
    const r=cp.spawnSync('devil',['pgsql','db','del',target],{input:'yes\n',encoding:'utf8',stdio:'pipe',timeout:60000,maxBuffer:1024*1024});
    const after=await exists();
    console.log('ADMIN_DELETE_EXIT='+String(r.status));
    console.log('ISOLATED_TEMP_DB_PRESENT_AFTER='+after);
    if(after){
      const o=String(r.stdout||'')+' '+String(r.stderr||'');
      // Publish only coarse command error classifications; no raw host outputs.
      const reason=/permission|forbidden|denied/i.test(o)?'ACCESS_DENIED':
        /exist|unknown|found/i.test(o)?'NOT_FOUND_OR_CATALOG':
        /connection|active|session/i.test(o)?'ACTIVE_CONNECTION':
        /confirm|password|prompt|enter/i.test(o)?'PROMPT_OR_INPUT':
        'OTHER';
      console.log('ADMIN_DELETE_ERROR_CLASS='+reason);
      throw Error('TEMP_RESTORE_DB_CLEANUP=BLOCKED');
    }
    console.log('TEMP_RESTORE_DB_CLEANUP=PASS');
  }finally{await client.end();}
})().catch(e=>{console.error('TEMP_RESTORE_DB_INSPECTION=FAIL: '+e.message);process.exitCode=1});
