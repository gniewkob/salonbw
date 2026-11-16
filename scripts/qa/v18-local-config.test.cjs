'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateLocalConfig } = require('./v18-local-config.cjs');
const name = 'v18_0123456789abcdef01234567';
const valid = { NEXT_PUBLIC_API_URL: '/api', API_PROXY_URL: 'http://api:3001', V18_DATABASE_NAME: name,
  DATABASE_URL: `postgresql://v18_local:synthetic@db:5432/${name}` };
test('accepts only the explicit disposable configuration', () => assert.doesNotThrow(() => validateLocalConfig(valid)));
for (const [key, value] of [
  ['CI', 'true'], ['GITHUB_ACTIONS', 'true'], ['NEXT_PUBLIC_API_URL', ''],
  ['NEXT_PUBLIC_API_URL', '//external.example'], ['API_PROXY_URL', ''],
  ['API_PROXY_URL', 'http://api:3001.evil.example'], ['API_PROXY_URL', 'http://api:3001/'],
  ['V18_DATABASE_NAME', 'postgres'], ['DATABASE_URL', 'postgresql://v18_local:x@localhost:5432/postgres'],
  ['DATABASE_URL', `postgresql://v18_local:x@db:5432/${name}?sslmode=disable`],
  ['DATABASE_URL', `postgresql://v18_local:x@db:5432/${name}#fragment`],
  ['DATABASE_URL', `postgresql://v18_local@db:5432/${name}`],
]) {
  test(`rejects ${key}=${value.replace(/:\/\/[^@]+@/, '://[REDACTED]@')}`, () =>
    assert.throws(() => validateLocalConfig({ ...valid, [key]: value })));
}
