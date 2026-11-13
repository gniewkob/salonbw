#!/usr/bin/env node
// Validates a staged DEV panel by starting it on loopback only.
// Does not touch the live domain, Passenger, database, or production.
// No credentials or response bodies are printed.
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';

const fail = (reason) => {
  console.error('DEV_PANEL_STAGE_SMOKE=BLOCKED reason=' + reason);
  process.exitCode = 1;
};

const sha = process.argv[2];
if (!/^[0-9a-f]{40}$/.test(sha || '')) {
  fail('invalid-sha');
} else {
  const home = process.env.HOME;
  if (!home || !path.isAbsolute(home)) {
    fail('invalid-home');
  } else {
    const stage = path.join(home, '.salonbw-manual/staged-panel', sha);
    const live = path.join(home, 'apps/nodejs/panelbw_dev');
    const link = path.join(home, 'domains/dev-panel.salon-bw.pl/public_nodejs');
    const state = (p) => { try { return fs.lstatSync(p); } catch { return null; } };
    const isRealDirectory = (p) => {
      const st = state(p);
      return !!st && st.isDirectory() && !st.isSymbolicLink();
    };
    const file = (p) => {
      const st = state(p);
      return !!st && st.isFile() && !st.isSymbolicLink();
    };
    if (!isRealDirectory(stage) || !isRealDirectory(live)) {
      fail('missing-or-symlinked-runtime');
    } else if (!state(link)?.isSymbolicLink() ||
               fs.realpathSync(link) !== fs.realpathSync(live)) {
      fail('unexpected-live-domain-target');
    } else {
      const paths = {
        config: path.join(stage, '.env.runtime.json'),
        release: path.join(stage, 'public/__release.json'),
        build: path.join(stage, '.next/BUILD_ID'),
        app: path.join(stage, 'app.cjs'),
        next: path.join(stage, 'node_modules/next/package.json'),
      };
      if (Object.values(paths).some(p => !file(p))) {
        fail('missing-staged-runtime-file');
      } else {
        try {
          const stat = state(paths.config);
          if (stat.size > 16384 || (stat.mode & 0o077) !== 0) {
            throw new Error('invalid-private-config-permissions');
          }
          const cfg = JSON.parse(fs.readFileSync(paths.config, 'utf8'));
          const release = JSON.parse(fs.readFileSync(paths.release, 'utf8'));
          const build = fs.readFileSync(paths.build, 'utf8').trim();
          if (cfg.APP_ENV !== 'development' ||
              cfg.NEXT_PUBLIC_DEPLOYMENT_ENV !== 'development' ||
              cfg.NEXT_PUBLIC_AUTH_COOKIE_PREFIX !== 'dev_' ||
              cfg.API_PROXY_URL !== 'https://dev-api.salon-bw.pl' ||
              cfg.APP_RELEASE !== sha ||
              !cfg.DEV_ACCESS_USER || !cfg.DEV_ACCESS_PASSWORD ||
              release.sha !== sha || release.environment !== 'development' ||
              release.api !== 'https://dev-api.salon-bw.pl' ||
              release.buildId !== build) {
            throw new Error('staged-runtime-isolation-mismatch');
          }
          const listen = net.createServer();
          await new Promise((resolve, reject) => {
            listen.once('error', reject);
            listen.listen(0, '127.0.0.1', resolve);
          });
          const port = listen.address().port;
          await new Promise((resolve, reject) => listen.close(e => e ? reject(e) : resolve()));
          const proc = spawn(process.execPath, ['app.cjs'], {
            cwd: stage,
            env: {
              ...process.env,
              NODE_ENV: 'production',
              HOSTNAME: '127.0.0.1',
              PORT: String(port),
              PASSENGER_PORT: String(port),
              NEXT_PUBLIC_DEPLOYMENT_ENV: 'development',
            },
            stdio: ['ignore', 'ignore', 'ignore'],
          });
          let exitEarly = false;
          proc.on('exit', () => { exitEarly = true; });
          const basic = 'Basic ' + Buffer.from(
            cfg.DEV_ACCESS_USER + ':' + cfg.DEV_ACCESS_PASSWORD,
          ).toString('base64');
          const base = 'http://127.0.0.1:' + port;
          const request = (pathname) => fetch(base + pathname, {
            redirect: 'manual',
            cache: 'no-store',
            headers: { Authorization: basic },
            signal: AbortSignal.timeout(5000),
          });
          let succeeded = false;
          try {
            for (let attempt = 0; attempt < 35; attempt++) {
              if (exitEarly) throw new Error('staged-runtime-exited');
              try {
                const r = await request('/__release.json');
                if (r.status === 200) {
                  const data = await r.json();
                  if (data.sha !== sha || data.buildId !== build) {
                    throw new Error('served-release-mismatch');
                  }
                  const login = await request('/auth/login');
                  if (login.status !== 200) {
                    throw new Error('staged-login-route-unavailable');
                  }
                  const html = await login.text();
                  if (!html.includes(build)) {
                    throw new Error('staged-html-build-id-mismatch');
                  }
                  const v18 = await request('/studio-v18');
                  if (![302,303,307,308].includes(v18.status) ||
                      new URL(v18.headers.get('location') || '', base).pathname !== '/auth/login') {
                    throw new Error('unauthenticated-v18-boundary-mismatch');
                  }
                  succeeded = true;
                  break;
                }
                if (r.status !== 502 && r.status !== 503) {
                  throw new Error('unexpected-staged-response');
                }
              } catch (error) {
                if (error.message !== 'fetch failed' &&
                    error.name !== 'TimeoutError') {
                  throw error;
                }
              }
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            if (!succeeded) throw new Error('staged-runtime-start-timeout');
            console.log('DEV_PANEL_STAGE_SMOKE=PASS sha=' + sha);
            console.log('STAGED_LOGIN=PASS');
            console.log('STAGED_V18_AUTH_BOUNDARY=PASS');
            console.log('LIVE_RUNTIME_MUTATIONS=NONE');
            console.log('PASSENGER_RESTART=NOT_STARTED');
          } finally {
            if (proc.exitCode === null) proc.kill('SIGTERM');
            await Promise.race([
              new Promise(resolve => proc.once('exit', resolve)),
              new Promise(resolve => setTimeout(resolve, 5000)),
            ]);
            if (proc.exitCode === null) proc.kill('SIGKILL');
          }
        } catch (error) {
          const allowed = new Set([
            'invalid-private-config-permissions', 'staged-runtime-isolation-mismatch',
            'staged-runtime-exited', 'served-release-mismatch',
            'staged-login-route-unavailable','staged-html-build-id-mismatch',
            'unauthenticated-v18-boundary-mismatch','unexpected-staged-response',
            'staged-runtime-start-timeout',
          ]);
          fail(allowed.has(error?.message) ? error.message : 'staged-start-or-http-failure');
        }
      }
    }
  }
}
