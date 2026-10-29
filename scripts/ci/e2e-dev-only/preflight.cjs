"use strict";
const fs=require("node:fs"),path=require("node:path"),dotenv=require("dotenv");
function fail(m){console.error("BLOCKED: "+m);process.exit(2);}
const root="/usr/home/vetternkraft/apps/nodejs";
const dev=dotenv.parse(fs.readFileSync(path.join(root,"api_salonbw_dev",".env")));
const prod=dotenv.parse(fs.readFileSync(path.join(root,"api_salonbw",".env")));
const identity=(e)=>{const u=e.DATABASE_URL?new URL(e.DATABASE_URL):null;
 return {db:u?decodeURIComponent(u.pathname.slice(1)):(e.PGDATABASE||e.DB_NAME),
  role:u?decodeURIComponent(u.username):(e.PGUSER||e.DB_USER)};};
const d=identity(dev),p=identity(prod);
if(d.db!=="p11522_salonbw_d"||!d.role||!p.db||!p.role)fail("database identity missing");
if(d.db===p.db||d.role===p.role)fail("production DB/role reused");
if(dev.APP_ENV!=="development")fail("APP_ENV not development");
if(dev.OUTBOUND_DELIVERY_ENABLED!=="false"||dev.SMSAPI_ENABLED!=="false")fail("outbound not disabled");
if(dev.DEV_DATABASE_NAME&&dev.DEV_DATABASE_NAME!==d.db)fail("DEV database name mismatch");
console.log("DEV_PRECHECK=PASS: unique database/role, APP_ENV and outbound off");
