'use strict';
// Intentionally not a production dump restore. Only public catalog + synthetic identities.
function assertDevelopmentSeed(env) {
  if (env.APP_ENV !== 'development' || env.OUTBOUND_DELIVERY_ENABLED !== 'false' || env.DEV_DATABASE_NAME !== 'p11522_salonbw_d') throw new Error('Development seed guard rejected');
  const url = new URL(env.DATABASE_URL);
  if (decodeURIComponent(url.pathname.slice(1)) !== env.DEV_DATABASE_NAME || decodeURIComponent(url.username) !== env.DEV_DATABASE_NAME) throw new Error('Development database mismatch');
  if (url.hostname !== 'pgsql0.mydevil.net') throw new Error('Development database host mismatch');
}
function publicCatalog(rows) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 1000) throw new Error('Invalid public catalog');
  return rows.filter(s => s.isActive && s.onlineBooking).map(s => {
    if (typeof s.name !== 'string' || !s.name || s.name.length > 255 || !Number.isInteger(s.duration) || s.duration < 1 || !Number.isFinite(Number(s.price)) || Number(s.price) < 0) throw new Error('Invalid public service');
    return {name:s.name,duration:s.duration,price:Number(s.price),priceType:s.priceType === 'from'?'from':'fixed',category:typeof s.categoryRelation?.name === 'string'?s.categoryRelation.name:typeof s.category === 'string'?s.category:'Inne',description:typeof s.publicDescription === 'string'?s.publicDescription:null,variants:(s.variants || []).filter(v => v.isActive !== false).map(v=>{
      if (typeof v.name !== 'string' || !Number.isInteger(v.duration) || v.duration < 1 || !Number.isFinite(Number(v.price)) || Number(v.price)<0)throw new Error('Invalid public variant');
      return {name:v.name,duration:v.duration,price:Number(v.price),priceType:v.priceType==='from'?'from':'fixed'};
    })};
  });
}
async function main() {
  require('dotenv').config({quiet:true});
  assertDevelopmentSeed(process.env);
  let input=''; for await (const chunk of process.stdin) {input+=chunk;if(input.length>4096)throw new Error('Input too large');}
  const {password,legacyEmails=[]}=JSON.parse(input);
  if (typeof password!=='string' || password.length<24)throw new Error('Private development password required');
  const response=await fetch('https://api.salon-bw.pl/services/public',{signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error('Public catalog unavailable');
  const catalog=publicCatalog(await response.json());
  const {Client}=require('pg');const bcrypt=require('bcrypt');const crypto=require('node:crypto');
  const db=new Client({connectionString:process.env.DATABASE_URL});await db.connect();
  try {
    await db.query('BEGIN');
    await db.query("SELECT pg_advisory_xact_lock(681995027)");
    const current=await db.query('SELECT current_database() AS name');
    if(current.rows[0].name!==process.env.DEV_DATABASE_NAME)throw new Error('Connected database mismatch');
    const legacy=await db.query(`SELECT id,email,name FROM users WHERE email NOT LIKE '%@salonbw.example.test'`);
    if(legacy.rows.length) {
      const appointments=await db.query('SELECT count(*)::int AS count FROM appointments');
      if(appointments.rows[0].count || legacy.rows.length>20 || !Array.isArray(legacyEmails) || legacy.rows.some(user=>!legacyEmails.includes(user.email) || !/test|e2e/i.test(user.name)))throw new Error('Development seed refuses non-synthetic identities');
      for(const user of legacy.rows) {
        const replacement=await bcrypt.hash(crypto.randomBytes(48).toString('base64url'),12);
        await db.query(`UPDATE users SET email=$2,password=$3,name='Konto migracyjne testowe',"receiveNotifications"=false,"authVersion"="authVersion"+1 WHERE id=$1`,[user.id,'migration-'+user.id+'@salonbw.example.test',replacement]);
        await db.query('DELETE FROM refresh_tokens WHERE "userId"=$1',[user.id]);
      }
    }
    const adminEmail='admin@salonbw.example.test', stylistEmail='stylist@salonbw.example.test';
    const adminHash=await bcrypt.hash(password,12),stylistHash=await bcrypt.hash(crypto.randomBytes(48).toString('base64url'),12);
    await db.query(`INSERT INTO users(email,password,name,role,"isSystemAdmin","receiveNotifications") VALUES($1,$2,'Administrator testowy','admin',true,false) ON CONFLICT(email) DO NOTHING`,[adminEmail,adminHash]);
    await db.query(`INSERT INTO users(email,password,name,role,"isSystemAdmin","receiveNotifications") VALUES($1,$2,'Stylistka testowa','admin',false,false) ON CONFLICT(email) DO NOTHING`,[stylistEmail,stylistHash]);
    const owner=(await db.query('SELECT id FROM users WHERE email=$1 AND role=$2 AND "isSystemAdmin"=false',[stylistEmail,'admin'])).rows[0];
    if(!owner)throw new Error('Synthetic stylist conflict');
    for(const service of catalog) {
      let category=(await db.query('SELECT id FROM service_categories WHERE name=$1 ORDER BY id LIMIT 1',[service.category])).rows[0];
      if(!category)category=(await db.query('INSERT INTO service_categories(name) VALUES($1) RETURNING id',[service.category])).rows[0];
      let record=(await db.query('SELECT id FROM services WHERE name=$1 ORDER BY id LIMIT 1',[service.name])).rows[0];
      if(!record)record=(await db.query('INSERT INTO services(name,duration,price,"priceType",category,"categoryId","publicDescription") VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',[service.name,service.duration,service.price,service.priceType,service.category,category.id,service.description])).rows[0];
      await db.query('INSERT INTO employee_services("employeeId","serviceId") SELECT $1,$2 WHERE NOT EXISTS(SELECT 1 FROM employee_services WHERE "employeeId"=$1 AND "serviceId"=$2 AND "serviceVariantId" IS NULL)',[owner.id,record.id]);
      for(const variant of service.variants) await db.query('INSERT INTO service_variants("serviceId",name,duration,price,"priceType") SELECT $1,$2,$3,$4,$5 WHERE NOT EXISTS(SELECT 1 FROM service_variants WHERE "serviceId"=$1 AND name=$2)',[record.id,variant.name,variant.duration,variant.price,variant.priceType]);
    }
    let timetable=(await db.query('SELECT id FROM timetables WHERE "employeeId"=$1 AND name=$2',[owner.id,'Development synthetic week'])).rows[0];
    if(!timetable){
      timetable=(await db.query(`INSERT INTO timetables("employeeId",name,"validFrom") VALUES($1,'Development synthetic week','2026-01-01') RETURNING id`,[owner.id])).rows[0];
      for(let day=0;day<5;day++)await db.query(`INSERT INTO timetable_slots("timetableId","dayOfWeek","startTime","endTime") VALUES($1,$2,'09:00','17:00')`,[timetable.id,day]);
    }
    await db.query('COMMIT');
    const counts=await db.query(`SELECT (SELECT count(*)::int FROM users) AS users,(SELECT count(*)::int FROM services) AS services,(SELECT count(*)::int FROM appointments) AS appointments`);
    console.log(JSON.stringify({status:'ok',synthetic:true,...counts.rows[0]}));
  }catch(error){await db.query('ROLLBACK');throw error;}finally{await db.end();}
}
module.exports={assertDevelopmentSeed,publicCatalog};
if(require.main===module)main().catch(()=>{console.error('Development seed failed; details withheld');process.exitCode=1;});
