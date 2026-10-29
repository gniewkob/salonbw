import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";

const PANEL = "https://dev-panel.salon-bw.pl";
const API = "https://dev-api.salon-bw.pl";
const LANDING = "https://dev.salon-bw.pl";
const SHA = "d017aebd3f6d0e95100b52d7cdc286507a959892";
for (const k of ["DEV_ACCESS_USER","DEV_ACCESS_PASSWORD","E2E_ADMIN_PASSWORD","GITHUB_RUN_ID"]) {
  assert.ok(process.env[k], "BLOCKED: missing " + k);
}
assert.equal(process.env.DEV_ACCESS_USER, "uat");
assert.equal(process.env.P0_DEV_PRECHECK, "verified-on-host");
const basic="Basic "+Buffer.from(process.env.DEV_ACCESS_USER+":"+process.env.DEV_ACCESS_PASSWORD).toString("base64");
const pause=(ms)=>new Promise(r=>setTimeout(r,ms));
async function call(path, method="GET", body, cookie="", host=PANEL) {
  assert.ok(path.startsWith("/") && !path.startsWith("//"));
  assert.ok([PANEL,API,LANDING].includes(host));
  // Nest CSRF middleware requires the per-session XSRF cookie in a matching
  // request header for authenticated writes (GET does not require this).
  const csrfCookie = cookie.split("; ").find(x=>x.split("=")[0].endsWith("XSRF-TOKEN"));
  const csrf = csrfCookie ? decodeURIComponent(csrfCookie.slice(csrfCookie.indexOf("=")+1)) : "";
  if (cookie && !["GET","HEAD","OPTIONS"].includes(method)) {
    assert.ok(csrf, "BLOCKED: missing signed session XSRF cookie for write");
  }
  const res=await fetch(host+path,{method,redirect:"manual",signal:AbortSignal.timeout(20000),
    headers:{"Authorization":basic,"Cache-Control":"no-cache",...(cookie?{"Cookie":cookie}:{}),
      ...(csrf?{"X-XSRF-TOKEN":csrf}:{}),
      ...(body?{"Content-Type":"application/json"}:{})},
    ...(body?{body:JSON.stringify(body)}:{})});
  return {status:res.status, data:await res.json().catch(()=>null),raw:res};
}
function status(r,n,l){assert.equal(r.status,n,l+" returned HTTP "+r.status)}
const ck=(r)=>r.raw.headers.getSetCookie().map(v=>v.split(";")[0]).join("; ");
async function main(){
  const [p,l,a]=await Promise.all([call("/__release.json"),call("/__release.json","GET",null,"",LANDING),
    call("/healthz","GET",null,"",API)]);
  for(const [r,n] of [[p,"panel"],[l,"landing"]]) {
    status(r,200,n); assert.equal(r.data?.sha,SHA);assert.equal(r.data?.environment,"development");
  }
  status(a,200,"api");assert.equal(a.raw.headers.get("x-salonbw-release"),SHA);
  assert.equal(a.data?.status,"ok");assert.equal(a.data?.services?.database?.status,"ok");
  assert.equal(a.data?.services?.smtp?.status,"skipped");
  assert.equal(a.data?.services?.instagram?.status,"skipped");
  console.log("EXACT_SHA_AND_OUTBOUND=PASS");
  const login=await call("/api/auth/login","POST",{email:"stylist@salonbw.example.test",password:process.env.E2E_ADMIN_PASSWORD});
  status(login,200,"synthetic admin login");const staff=ck(login);assert.ok(staff.includes("accessToken="));
  const profile=await call("/api/users/profile","GET",null,staff);
  status(profile,200,"admin profile");
  assert.equal(profile.data?.role,"admin");assert.equal(profile.data?.email,"stylist@salonbw.example.test");
  const marker=process.env.GITHUB_RUN_ID.replace(/[^0-9]/g,"");
  const email="uat-booking-"+marker+"@example.invalid";
  const reg=await call("/api/auth/register","POST",{email,name:"UAT Booking "+marker,
    password:randomBytes(24).toString("base64url")+"A9!",gdprConsent:true,termsConsent:true,
    smsConsent:false,emailConsent:false,whatsappConsent:false});
  status(reg,201,"synthetic client registration");
  const client=ck(reg);assert.ok(client.includes("accessToken="));
  const cprof=await call("/api/users/profile","GET",null,client);
  status(cprof,200,"client profile");assert.equal(cprof.data?.email,email);
  assert.equal(cprof.data?.role,"client");
  console.log("SYNTHETIC_CLIENT_REGISTRATION=PASS");
  const catalog=await call("/api/services/online-booking","GET",null,client);
  status(catalog,200,"online catalog");assert.ok(Array.isArray(catalog.data));
  const services=catalog.data.filter(s=>s?.onlineBooking&&s?.isActive&&s?.duration>0&&s?.id>0);
  assert.ok(services.length,"no online services");
  let slot;
  for(const service of services.slice(0,3)){
    for(const days of [5,8,12]){
      await pause(1400);
      const date=new Date(Date.now()+days*86400000).toISOString().slice(0,10);
      const list=await call("/api/calendar/available-slots?serviceId="+service.id+"&date="+date,"GET",null,client);
      if(list.status===429)throw Error("BLOCKED: rate limited; no retry");
      status(list,200,"available slots");
      const item=Array.isArray(list.data)?list.data.find(x=>Number.isInteger(x.employeeId)&&Date.parse(x.time)>Date.now()+3600000):null;
      if(item){slot={serviceId:service.id,employeeId:item.employeeId,startTime:item.time};break;}
    }
    if(slot)break;
  }
  assert.ok(slot,"BLOCKED: no live free slot");
  console.log("LIVE_BOOKABLE_SLOT=PASS");
  let id;
  try{
    const forbidden=await call("/api/appointments","POST",{...slot,forceOverlap:true},client);
    status(forbidden,403,"client forceOverlap guard");console.log("UNAUTHORIZED_OVERRIDE_403=PASS");
    const created=await call("/api/appointments","POST",slot,client);
    status(created,201,"online appointment create");id=created.data?.id;
    assert.ok(Number.isInteger(id)&&id>0);console.log("BOOKING_WRITE_201=PASS");
    const mine=await call("/api/appointments/me","GET",null,client);
    status(mine,200,"my appointments");
    assert.ok(Array.isArray(mine.data)&&mine.data.some(x=>x.id===id),"visit missing from client");
    const from=encodeURIComponent(new Date(Date.parse(slot.startTime)-3600000).toISOString());
    const to=encodeURIComponent(new Date(Date.parse(slot.startTime)+86400000).toISOString());
    const all=await call("/api/appointments?from="+from+"&to="+to,"GET",null,staff);
    status(all,200,"staff list");assert.ok(Array.isArray(all.data)&&all.data.some(x=>x.id===id),"visit missing from admin");
    console.log("PERSISTED_CLIENT_AND_ADMIN=PASS");
    const dup=await call("/api/appointments","POST",slot,client);
    status(dup,409,"same-slot duplicate");
    console.log("BOOKING_CONFLICT_409=PASS");
  }finally{
    if(id){
      const cancelled=await call("/api/appointments/"+id+"/cancel","PATCH",null,client);
      status(cancelled,200,"cancel synthetic test booking");
      console.log("SYNTHETIC_BOOKING_CANCELLED=PASS");
    }
  }
  const local=(d)=>new Intl.DateTimeFormat("pl-PL",{timeZone:"Europe/Warsaw",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date(d));
  assert.equal(local("2026-10-25T00:30:00Z"),local("2026-10-25T01:30:00Z"));
  console.log("WARSAW_FOLD_VALIDATION=PASS");
  console.log("HOSTED_DEV_SYNTHETIC_BOOKING=PASS");
}
main().catch(e=>{console.error("HOSTED_DEV_SYNTHETIC_BOOKING=FAIL: "+e.message);process.exitCode=1});
