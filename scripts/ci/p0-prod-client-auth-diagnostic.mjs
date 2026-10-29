import assert from 'node:assert/strict';
const email=process.env.E2E_CLIENT_EMAIL;
const password=process.env.E2E_CLIENT_PASSWORD;
assert.ok(email && password, 'BLOCKED: missing synthetic production E2E client credentials');
const base='https://panel.salon-bw.pl';
const opts={redirect:'manual',signal:AbortSignal.timeout(20000)};
try{
  const page=await fetch(base+'/auth/login',opts);
  if(page.status!==200){
    console.log('PRODUCTION_LOGIN_PAGE=BLOCKED HTTP_'+page.status);
    process.exitCode=2;
  }else{
    console.log('PRODUCTION_LOGIN_PAGE=PASS');
    const result=await fetch(base+'/api/auth/login',{
      method:'POST',redirect:'manual',signal:AbortSignal.timeout(20000),
      headers:{'Content-Type':'application/json','Cache-Control':'no-store'},
      body:JSON.stringify({email,password}),
    });
    // No payload, cookies, email, password, headers or traces are logged.
    if(result.status===200)console.log('PRODUCTION_TEST_CLIENT_API_LOGIN=PASS');
    else{
      console.log('PRODUCTION_TEST_CLIENT_API_LOGIN=FAIL_HTTP_'+result.status);
      process.exitCode=3;
    }
  }
}catch{
  console.log('PRODUCTION_TEST_CLIENT_API_LOGIN=NETWORK_OR_TIMEOUT');
  process.exitCode=4;
}
