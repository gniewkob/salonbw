'use strict';
// Production Postgres is READ ONLY here: pg_dump plus aggregate-only checks.
// The only SQL DDL targets a new named, isolated restore database.
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const cp=require('node:child_process');
const dotenv=require('dotenv');
const {Client}=require('pg');
process.umask(0o077);
const run=process.argv[2]||'';
function stop(message){throw new Error(message);}
if(!/^[0-9]{6,18}$/.test(run))stop('invalid immutable run identifier');
const apiRoot='/usr/home/vetternkraft/apps/nodejs/api_salonbw';
if(fs.realpathSync(process.cwd())!==apiRoot)stop('not within canonical production API root');
const vars=dotenv.parse(fs.readFileSync(path.join(apiRoot,'.env')));
const link=vars.DATABASE_URL?new URL(vars.DATABASE_URL):null;
const DB={
  host:link?.hostname||(vars.PGHOST||vars.DB_HOST),
  port:link?.port||vars.PGPORT||vars.DB_PORT||'5432',
  user:link?decodeURIComponent(link.username):(vars.PGUSER||vars.DB_USER),
  password:link?decodeURIComponent(link.password):(vars.PGPASSWORD||vars.DB_PASS),
  name:link?decodeURIComponent(link.pathname.slice(1)):(vars.PGDATABASE||vars.DB_NAME),
};
if(!DB.host||!DB.user||!DB.password||!DB.name)stop('production database credentials absent');
if(DB.name==='p11522_salonbw_d'||DB.name.endsWith('_d')||/dev|test|restore|uat/i.test(DB.name))
  stop('refusing non-production source database');
const remoteDir=path.join(os.homedir(),'.deployment-private','production-db-restore-audit');
const realHome=fs.realpathSync(os.homedir());
if(realHome!=='/usr/home/vetternkraft'&&realHome!=='/home/vetternkraft')
  stop('unexpected home for production backup');
fs.mkdirSync(remoteDir,{recursive:true,mode:0o700});
if(fs.lstatSync(remoteDir).isSymbolicLink())stop('backup directory may not be a symlink');
fs.chmodSync(remoteDir,0o700);
const backup=path.join(remoteDir,'p0-'+run+'.dump');
if(fs.existsSync(backup))stop('refuse overwrite existing production backup');
const env={...process.env,PGHOST:DB.host,PGPORT:String(DB.port),PGUSER:DB.user,
  PGPASSWORD:DB.password,PGDATABASE:DB.name,PGCONNECT_TIMEOUT:'15'};
if(vars.PGSSL==='1')env.PGSSLMODE='require';
function pgcli(command,args,stage){
  const result=cp.spawnSync(command,args,{env,stdio:'pipe',encoding:'utf8',timeout:900000,maxBuffer:1024*1024});
  if(result.error||result.status!==0)stop(stage+' failed (exit status '+String(result.status)+'); details withheld');
}
const restoreName='sbw_restore_'+run;
if(!/^[a-z0-9_]+$/.test(restoreName)||restoreName===DB.name)stop('invalid restore db');
let created=false;
let backupValidated=false;
async function pgprobe(name){
  const c=new Client({host:DB.host,port:Number(DB.port),user:DB.user,password:DB.password,
    database:name,connectionTimeoutMillis:15000,ssl:vars.PGSSL==='1'?{rejectUnauthorized:false}:undefined});
  await c.connect();return c;
}
async function main(){
  let prod;
  try{
    prod=await pgprobe(DB.name);
    const p=await prod.query('SELECT current_database() AS db,current_user AS role');
    if(p.rows[0]?.db!==DB.name||p.rows[0]?.role!==DB.user)stop('production identity mismatch');
    const priv=await prod.query('SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user');
    console.log('SOURCE_IDENTITY=PASS (name and role withheld)');
    pgcli('pg_dump',['--format=custom','--no-owner','--no-privileges','--file',backup,DB.name],'fresh pg_dump');
    fs.chmodSync(backup,0o600);
    if(fs.statSync(backup).size<4096)stop('dump implausibly small');
    pgcli('pg_restore',['--list',backup],'dump catalog verification');
    backupValidated=true;
    console.log('FRESH_PROD_PG_DUMP=PASS (owner-only file, catalog verified, no data exported)');
    if(!priv.rows[0]?.rolcreatedb)stop('ISOLATED_RESTORE=BLOCKED: production DB role lacks CREATEDB');
    // Create a unique database, never reuse dev/prod; restrict PUBLIC CONNECT
    // immediately so no application or other role can access the PII fixture.
    pgcli('createdb',['--maintenance-db',DB.name,restoreName],'create isolated database');
    created=true;
    pgcli('psql',['--no-psqlrc','--set','ON_ERROR_STOP=1','--dbname',DB.name,
      '--command','REVOKE CONNECT ON DATABASE '+restoreName+' FROM PUBLIC'],'isolate restore ACL');
    pgcli('pg_restore',['--no-owner','--no-privileges','--exit-on-error','--single-transaction',
      '--dbname',restoreName,backup],'isolated pg_restore');
    const restored=await pgprobe(restoreName);
    try{
      const original=await prod.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");
      const clone=await restored.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");
      const total=Number(clone.rows[0]?.n);
      if(!Number.isInteger(total)||total<20||total!==Number(original.rows[0]?.n))
        stop('restored table inventory mismatch or unexpectedly small schema');
      const tables=await restored.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name");
      let nonempty=0;
      let totalRows=0;
      for(const row of tables.rows){
        const quoted='"'+row.table_name.replace(/"/g,'""')+'"';
        const count=await restored.query('SELECT count(*)::bigint AS n FROM public.'+quoted);
        const value=Number(count.rows[0].n);
        if(!Number.isSafeInteger(value))stop('unexpected table count');
        totalRows+=value;
        if(value>0)nonempty++;
      }
      if(nonempty<5||totalRows<50)stop('restored data inventory implausibly small');
      console.log('ISOLATED_RESTORE=PASS: tables='+total+' nonempty='+nonempty+' total_rows='+totalRows);
    }finally{await restored.end();}
  }finally{
    if(prod)await prod.end().catch(()=>{});
    if(created){
      try{
        // Drop ONLY the immutable database created by this run.
        pgcli('dropdb',['--if-exists','--maintenance-db',DB.name,restoreName],'isolated DB cleanup');
        console.log('ISOLATED_RESTORE_DB_CLEANUP=PASS');
      }catch(error){
        console.error('CRITICAL: temporary DB cleanup failed; exact name withheld, manual operator action required');
        throw error;
      }
    }
    if(backupValidated)console.log('PRODUCTION_BACKUP_RETAINED=PASS (owner-only)');
  }
}
main().catch(e=>{console.error('P0_PROD_RESTORE_GATE=BLOCKED: '+e.message);process.exitCode=1});
