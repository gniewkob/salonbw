'use strict';

// This validator is a building block, not permission to start an application.
// A future runner must validate the actual process environment immediately
// before each launch and independently enforce network isolation.
function validateLocalConfig(env) {
  if (env.CI || env.GITHUB_ACTIONS) throw new Error('local only');
  if (env.NEXT_PUBLIC_API_URL !== '/api') throw new Error('client API must use same-origin proxy');
  if (env.API_PROXY_URL !== 'http://api:3001') throw new Error('proxy API must use internal DNS');
  if (!/^v18_[a-f0-9]{24}$/.test(env.V18_DATABASE_NAME || '')) throw new Error('invalid disposable database');
  let db;
  try { db = new URL(env.DATABASE_URL); } catch { throw new Error('invalid database URL'); }
  if (db.protocol !== 'postgresql:' || db.hostname !== 'db' || db.port !== '5432' ||
      db.pathname !== `/${env.V18_DATABASE_NAME}` || db.username !== 'v18_local' ||
      !db.password || db.search || db.hash) throw new Error('database must be the disposable internal database');
}
module.exports = { validateLocalConfig };
