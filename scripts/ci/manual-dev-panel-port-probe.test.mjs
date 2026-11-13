import test from 'node:test';
import assert from 'node:assert/strict';
import {bindOnce,compareBinds} from '../mydevil/manual-dev-panel-port-probe.mjs';

const statuses=new Set(['PASS','PERMISSION_DENIED','IN_USE','UNAVAILABLE_ADDRESS','UNAVAILABLE','SKIPPED']);

test('temporary port zero listener cleans up immediately',async()=>{
  const result=await bindOnce(0,'127.0.0.1');
  assert.ok(statuses.has(result.status));
  if(result.status==='PASS'){
    assert.ok(Number.isSafeInteger(result.port));
    assert.ok(result.port>=1024&&result.port<=65535);
  }
});

test('explicit-port versus auto-port probe uses fixed, non-sensitive status vocabulary',async()=>{
  const result=await compareBinds();
  assert.deepEqual(Object.keys(result),[
    'autoLoopback','explicitLoopback','explicitWildcard','autoWildcard',
  ]);
  for(const value of Object.values(result)){
    assert.ok(statuses.has(value),value);
  }
});

test('invalid local address cannot be reported as success',async()=>{
  const result=await bindOnce(0,'203.0.113.199');
  assert.notEqual(result.status,'PASS');
});
