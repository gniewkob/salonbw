import test from 'node:test';
import assert from 'node:assert/strict';
import seed from '../../backend/salonbw-backend/scripts/seed-development.cjs';
const databaseUrl=(database='p11522_salonbw_d')=>{const url=new URL('postgresql://pgsql0.mydevil.net/'+database);url.username=database;url.password='fixture';return url.href;};
const env={APP_ENV:'development',OUTBOUND_DELIVERY_ENABLED:'false',DEV_DATABASE_NAME:'p11522_salonbw_d',DATABASE_URL:databaseUrl()};
test('seed rejects production, shared database and enabled delivery',()=>{
 assert.doesNotThrow(()=>seed.assertDevelopmentSeed(env));
 for(const extra of [{APP_ENV:'production'},{OUTBOUND_DELIVERY_ENABLED:'true'},{DATABASE_URL:databaseUrl('production')}])assert.throws(()=>seed.assertDevelopmentSeed({...env,...extra}));
});
test('seed projects only curated public business fields, never arbitrary customer data',()=>{
 const rows=seed.publicCatalog([{name:'Fixture',duration:30,price:'120',isActive:true,onlineBooking:true,privateDescription:'PRIVATE',email:'PRIVATE',employeeServices:[{user:'PRIVATE'}],variants:[]}]);
 assert.equal(rows.length,1);assert.equal(rows[0].price,120);assert.doesNotMatch(JSON.stringify(rows),/PRIVATE/);
 assert.throws(()=>seed.publicCatalog([{name:'Invalid',duration:-1,price:120,isActive:true,onlineBooking:true}]));
});
