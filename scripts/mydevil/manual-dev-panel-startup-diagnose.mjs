#!/usr/bin/env node
// Read-only diagnostics of an isolated staged DEV panel. No raw child output,
// private config, filenames, full paths, tokens, or response bodies logged.
// Does not modify the live app, change the domain, or restart Passenger.
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const modules = [
  ['next', 'NEXT'],
  ['react', 'REACT'],
  ['react-dom', 'REACT_DOM'],
  ['styled-jsx', 'STYLED_JSX'],
  ['@next/env', 'NEXT_ENV'],
  ['@swc/helpers', 'SWC_HELPERS'],
  ['@salonbw/api', 'SALONBW_API'],
  ['@sentry/nextjs', 'SENTRY_NEXTJS'],
  ['picocolors', 'PICOCOLORS'],
  ['sharp', 'SHARP'],
];
export function classifyStartupOutput(raw, exitCode, signal) {
  let category = 'UNCLASSIFIED_EXIT';
  if (/Cannot find module|Cannot find package|MODULE_NOT_FOUND|ERR_MODULE_NOT_FOUND|Module not found/i.test(raw)) {
    category = 'MISSING_MODULE';
  } else if (/ERR_DLOPEN_FAILED|invalid ELF|dlopen[(]|not a valid Win32/i.test(raw)) {
    category = 'NATIVE_MODULE_LOAD_FAILURE';
  } else if (/EADDRINUSE|EACCES.*listen|listen.*EACCES/i.test(raw)) {
    category = 'PORT_BIND_FAILURE';
  } else if (/heap out of memory|allocation failed|out of memory/i.test(raw)) {
    category = 'MEMORY_FAILURE';
  } else if (/SyntaxError|TypeError|ReferenceError/i.test(raw)) {
    category = 'JAVASCRIPT_STARTUP_ERROR';
  }
  const missing = raw.match(
    /(?:Cannot find module|Cannot find package|Module not found: Can.t resolve)\s*['"]([^'"]+)['"]/i,
  );
  const known = missing && modules.find(([name]) =>
    missing[1] === name || missing[1].startsWith(name + '/'));
  return {
    category,
    module: known ? known[1] : 'OTHER_OR_UNRECOGNIZED',
    exitCode: Number.isInteger(exitCode) && exitCode >= 0 && exitCode <= 255
      ? String(exitCode) : 'UNKNOWN',
    signal: ['SIGTERM','SIGKILL','SIGABRT'].includes(signal)
      ? signal : 'NONE_OR_UNKNOWN',
  };
}

function stat(p) {
  try { return fs.lstatSync(p); } catch { return null; }
}
function realDir(p) {
  const s = stat(p);
  return Boolean(s?.isDirectory() && !s.isSymbolicLink());
}
function die(reason) {
  console.error('DEV_PANEL_STARTUP_DIAG=BLOCKED reason=' + reason);
  process.exitCode = 1;
}
function capped(previous, chunk) {
  return (previous + chunk.toString('utf8')).slice(0, 32768);
}

export async function diagnose(home, sha, runtimeMs = 12000) {
  if (!/^[0-9a-f]{40}$/.test(sha || '') || !path.isAbsolute(home || '')) {
    throw new Error('invalid-arguments');
  }
  const stage = path.join(home, '.salonbw-manual/staged-panel', sha);
  const live = path.join(home, 'apps/nodejs/panelbw_dev');
  const domain = path.join(home, 'domains/dev-panel.salon-bw.pl/public_nodejs');
  if (!realDir(stage) || !realDir(live) || !stat(domain)?.isSymbolicLink() ||
      fs.realpathSync(domain) !== fs.realpathSync(live)) {
    throw new Error('runtime-path-guard-failed');
  }
  const app = path.join(stage, 'app.cjs');
  const configFile = path.join(stage, '.env.runtime.json');
  const releaseFile = path.join(stage, 'public/__release.json');
  if (![app, configFile, releaseFile].every(p => stat(p)?.isFile() && !stat(p)?.isSymbolicLink())) {
    throw new Error('missing-runtime-file');
  }
  if (stat(configFile).size > 16384 || (stat(configFile).mode & 0o077)) {
    throw new Error('private-config-permissions');
  }
  const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  const release = JSON.parse(fs.readFileSync(releaseFile, 'utf8'));
  if (config.APP_RELEASE !== sha || release.sha !== sha ||
      config.APP_ENV !== 'development' ||
      config.API_PROXY_URL !== 'https://dev-api.salon-bw.pl' ||
      config.NEXT_PUBLIC_AUTH_COOKIE_PREFIX !== 'dev_') {
    throw new Error('invalid-dev-runtime-config');
  }

  const require = createRequire(app);
  const availability = [];
  for (const [name, label] of modules) {
    try {
      require.resolve(name);
      availability.push([label, 'FOUND']);
    } catch {
      availability.push([label, 'MISSING']);
    }
  }

  const listener = net.createServer();
  await new Promise((resolve, reject) => {
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', resolve);
  });
  const port = listener.address().port;
  await new Promise((resolve, reject) => {
    listener.close(error => error ? reject(error) : resolve());
  });

  let stdout = '';
  let stderr = '';
  let code = null;
  let signal = null;
  let exited = false;
  let reachable = false;
  let exitedBeforeCleanup = false;
  const child = spawn(process.execPath, ['app.cjs'], {
    cwd: stage,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      HOSTNAME: '127.0.0.1',
      PORT: String(port),
      PASSENGER_PORT: String(port),
      NEXT_PUBLIC_DEPLOYMENT_ENV: 'development',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', chunk => {stdout = capped(stdout, chunk);});
  child.stderr.on('data', chunk => {stderr = capped(stderr, chunk);});
  let closed = false;
  child.on('error', () => {exited = true;});
  child.on('exit', (c, s) => {exited = true;code = c;signal = s;});
  child.on('close', () => {closed = true;});

  try {
    for (let i = 0; i < runtimeMs / 400; i++) {
      if (exited) break;
      try {
        const response = await fetch('http://127.0.0.1:' + port + '/__release.json', {
          redirect: 'manual', cache: 'no-store',
          signal: AbortSignal.timeout(350),
        });
        // HTTP reachability is only diagnostic; it is not a smoke PASS.
        if (response.status > 0) {
          reachable = true;
          await response.body?.cancel();
          break;
        }
      } catch { /* The process may still be starting. */ }
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  } finally {
    exitedBeforeCleanup = exited;
    if (!exited) child.kill('SIGTERM');
    if (!closed) {
      await Promise.race([
        new Promise(resolve => child.once('close', resolve)),
        new Promise(resolve => setTimeout(resolve, 1500)),
      ]);
    }
    if (!closed) child.kill('SIGKILL');
  }
  return {availability, ...classifyStartupOutput(stderr + '\n' + stdout, code, signal), reachable, exited:exitedBeforeCleanup};
}

if (process.argv[1] === '-' ||
    (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)) {
  try {
    if (process.argv.length !== 3) throw new Error('invalid-arguments');
    const result = await diagnose(process.env.HOME, process.argv[2]);
    for (const [name, status] of result.availability) {
      console.log('STAGED_DEPENDENCY_' + name + '=' + status);
    }
    console.log('STAGED_PROCESS_EARLY_EXIT=' + (result.exited ? 'YES' : 'NO'));
    console.log('STAGED_PROCESS_HTTP_REACHABLE=' + (result.reachable ? 'YES' : 'NO'));
    console.log('STAGED_PROCESS_EXIT_CLASS=' + result.category);
    console.log('STAGED_PROCESS_MISSING_MODULE=' + result.module);
    console.log('STAGED_PROCESS_EXIT_CODE=' + result.exitCode);
    console.log('STAGED_PROCESS_EXIT_SIGNAL=' + result.signal);
    console.log('LIVE_RUNTIME_MUTATIONS=NONE');
    console.log('PASSENGER_RESTART=NOT_STARTED');
    console.log('DEV_PANEL_STARTUP_DIAG=PASS (diagnostics-only, not deployment approval)');
  } catch (error) {
    const allowed = new Set([
      'invalid-arguments','runtime-path-guard-failed','missing-runtime-file',
      'private-config-permissions','invalid-dev-runtime-config',
    ]);
    die(allowed.has(error?.message) ? error.message : 'runtime-diagnostic-error');
  }
}
