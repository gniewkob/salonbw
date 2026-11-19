#!/usr/bin/env bash
# Stage a SHA-verified Mac-built DEV panel bundle on MyDevil FreeBSD.
# Installs dependencies OUTSIDE live panelbw_dev. No Passenger restart.
set -euo pipefail
umask 077

usage() {
  echo 'Usage: bash manual-dev-panel-stage.sh <40-char-sha> <64-char-archive-sha256>' >&2
  exit 2
}
[[ $# -eq 2 ]] || usage
sha="$1"
expected_digest="$2"
[[ "$sha" =~ ^[a-f0-9]{40}$ ]] || usage
[[ "$expected_digest" =~ ^[a-f0-9]{64}$ ]] || usage

root="$HOME/.salonbw-manual"
source_dir="$root/sources/$sha"
incoming="$root/incoming/panel-dev-$sha.tar.gz"
stage_root="$root/staged-panel"
final="$stage_root/$sha"
live="$HOME/apps/nodejs/panelbw_dev"
link="$HOME/domains/dev-panel.salon-bw.pl/public_nodejs"
lock_root="$root/locks"
lock="$lock_root/panel-stage"

fail() {
  echo "MANUAL_DEV_PANEL_STAGE=BLOCKED reason=$1" >&2
  exit 1
}
for tool in node22 npm22 devil df tar git mktemp; do
  command -v "$tool" >/dev/null || fail "missing-tool"
done
for dir in "$root" "$source_dir" "$live" "$root/incoming"; do
  [[ -d "$dir" && ! -L "$dir" ]] || fail "unexpected-directory"
done
[[ -L "$link" && -d "$link" ]] || fail "dev-domain-link-missing"
[[ "$(cd -P "$live" && pwd -P)" == "$(cd -P "$link" && pwd -P)" ]] ||
  fail "domain-rerouted"
[[ -f "$source_dir/.salonbw-source-sha" && ! -L "$source_dir/.salonbw-source-sha" ]] ||
  fail "source-receipt-missing"
[[ "$(cat "$source_dir/.salonbw-source-sha")" == "$sha" ]] ||
  fail "source-receipt-mismatch"
[[ -f "$live/.env.runtime.json" && ! -L "$live/.env.runtime.json" ]] ||
  fail "private-config-missing"
[[ -f "$incoming" && ! -L "$incoming" ]] || fail "archive-missing"
[[ ! -e "$final" && ! -L "$final" ]] ||
  fail "stage-already-exists"

# Policy must be exactly the currently approved master quota guard.
mirror="$root/git-source"
guard="scripts/ci/check-mydevil-dev-quota.cjs"
[[ -d "$mirror/.git" ]] || fail "source-mirror-missing"
master_blob="$(git -C "$mirror" rev-parse "refs/remotes/origin/master:$guard")" ||
  fail "quota-policy-missing"
source_blob="$(git -C "$mirror" rev-parse "$sha:$guard")" ||
  fail "release-quota-policy-missing"
[[ "$source_blob" == "$master_blob" ]] || fail "quota-policy-drift"
[[ "$(git hash-object "$source_dir/$guard")" == "$master_blob" ]] ||
  fail "on-disk-quota-policy-drift"
account="$(devil info limits)" || fail "account-quota-unavailable"
free_kib="$(df -Pk "$HOME" | awk 'NR == 2 {print $4}')"
[[ "$free_kib" =~ ^[0-9]+$ ]] || fail "filesystem-quota-unavailable"
printf '%s\n' "$account" |
  MYDEVIL_FILESYSTEM_FREE_KIB="$free_kib" \
  node22 "$source_dir/$guard" >/dev/null ||
  fail "quota-below-approved-minimum"

actual_digest="$(node22 - "$incoming" <<'NODE'
const fs=require('fs'), crypto=require('crypto');
const file=process.argv[2];
const hash=crypto.createHash('sha256');
const s=fs.createReadStream(file);
s.on('data', x=>hash.update(x));
s.on('error', ()=>process.exit(1));
s.on('end', ()=>console.log(hash.digest('hex')));
NODE
)"
[[ "$actual_digest" == "$expected_digest" ]] || fail "archive-digest-mismatch"

[[ ! -L "$lock_root" && ! -L "$stage_root" ]] ||
  fail "unexpected-staging-symlink"
mkdir -p "$lock_root" "$stage_root"
mkdir "$lock" 2>/dev/null || fail "another-stage-in-progress"
temp=""
stage_complete=false
cleanup() {
  if [[ -n "$temp" && -d "$temp" ]]; then rm -rf -- "$temp"; fi
  rmdir "$lock" 2>/dev/null || true
}
trap cleanup EXIT
temp="$(mktemp -d "$root/panel-candidate.XXXXXXXX")"

# Only top-level relative archive entries are accepted. The supplied
# archive is also SHA-256 pinned to the operator-built artifact.
tar -tzf "$incoming" | while IFS= read -r entry; do
  case "$entry" in
    ./|./*) ;;
    *) echo 'Unsafe archive entry prefix' >&2; exit 1 ;;
  esac
  case "/$entry/" in
    *"/../"*|*"/./../"*) echo 'Unsafe archive parent traversal' >&2; exit 1 ;;
  esac
done
# Reject all symlink/hardlink members before extraction, even though the
# archive comes from our own SHA-pinned packager.
if tar -tvzf "$incoming" | awk '$1 ~ /^[lh]/ { found=1 } END { exit !found }'; then
  fail "archive-contains-links"
fi
tar -xzf "$incoming" -C "$temp"

[[ -d "$temp/.next" && -f "$temp/.next/BUILD_ID" && -d "$temp/public" && -f "$temp/public/__release.json" ]] ||
  fail "incomplete-panel-build"
[[ -f "$temp/app.cjs" && -f "$temp/package.json" && -f "$temp/packages/api/package.json" ]] ||
  fail "incomplete-runtime-bundle"
[[ ! -e "$temp/node_modules" && ! -e "$temp/.env.runtime.json" ]] ||
  fail "bundle-contains-forbidden-runtime-inputs"
[[ -f "$temp/.next/server/font-manifest.json" && ! -L "$temp/.next/server/font-manifest.json" ]] ||
  fail "next-runtime-font-manifest-missing"
[[ -f "$temp/scripts/staged-listen-host.cjs" && ! -L "$temp/scripts/staged-listen-host.cjs" ]] ||
  fail "stage-loopback-guard-missing"

node22 - "$temp" "$sha" <<'NODE'
const fs=require('fs'),path=require('path');
const root=process.argv[2],sha=process.argv[3];
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const rel=JSON.parse(fs.readFileSync(path.join(root,'public/__release.json'),'utf8'));
const build=fs.readFileSync(path.join(root,'.next/BUILD_ID'),'utf8').trim();
if(pkg.name!=='@salonbw/panel'||pkg.dependencies?.['@salonbw/api']!=='file:./packages/api'||
  pkg.dependencies?.next!=='15.5.28'||
  rel.sha!==sha||rel.environment!=='development'||
  rel.api!=='https://dev-api.salon-bw.pl'||rel.buildId!==build)process.exit(1);
NODE

# Clone only the live DEV private runtime values into the staged release.
# Never include secrets in a transport artifact or print them to the console.
node22 - "$live/.env.runtime.json" "$temp/.env.runtime.json" "$sha" <<'NODE'
const fs=require('fs');
const source=process.argv[2],dest=process.argv[3],sha=process.argv[4];
const st=fs.lstatSync(source);
if(!st.isFile()||st.isSymbolicLink()||st.size>16384||(st.mode&0o077)!==0)
  process.exit(1);
const env=JSON.parse(fs.readFileSync(source,'utf8'));
if(env.APP_ENV!=='development'||env.NEXT_PUBLIC_DEPLOYMENT_ENV!=='development'||
  env.API_PROXY_URL!=='https://dev-api.salon-bw.pl'||
  env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX!=='dev_'||
  !env.DEV_ACCESS_USER||!env.DEV_ACCESS_PASSWORD)process.exit(1);
env.APP_RELEASE=sha;
fs.writeFileSync(dest,JSON.stringify(env),{mode:0o600,flag:'wx'});
NODE

# FreeBSD-native dependencies, isolated from every currently running app.
cd "$temp"
npm22 install --omit=dev --ignore-scripts --no-package-lock \
  --no-audit --no-fund --loglevel=error
[[ -d node_modules && -f node_modules/next/package.json && -f node_modules/react/package.json && -f node_modules/@salonbw/api/package.json ]] ||
  fail "runtime-dependency-install-incomplete"
node22 - <<'NODE'
const fs=require('fs');
for(const path of ['node_modules/next/package.json','node_modules/react/package.json']) {
  const obj=JSON.parse(fs.readFileSync(path,'utf8'));
  if(path.includes('/next/')&&obj.version!=='15.5.28')process.exit(1);
}
NODE

mkdir -p "$temp/tmp"
# MyDevil serves public/ with a separate WWW process after Passenger activation.
# Keep the private config and Passenger tmp owner-only, while making the
# release tree traversable and its public/runtime files readable. Normalize
# before the atomic staging publish; never chmod the live panel or symlinks.
# Standalone CommonJS snippet because this script is streamed via SSH stdin.
node22 - "$temp" <<'STAGE_PERMISSIONS'
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = process.argv[2];
const fail = reason => {
  console.error('STAGED_PERMISSIONS=BLOCKED reason=' + reason);
  process.exit(1);
};
if (!root || !path.isAbsolute(root)) fail('invalid-root');
const stat = p => {
  try { return fs.lstatSync(p); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
};
const rootInfo = stat(root);
if (!rootInfo?.isDirectory() || rootInfo.isSymbolicLink()) fail('invalid-root');
const tmp = path.join(root, 'tmp');
const config = path.join(root, '.env.runtime.json');
const tmpInfo = stat(tmp);
const configInfo = stat(config);
if (!tmpInfo?.isDirectory() || tmpInfo.isSymbolicLink() ||
    (tmpInfo.mode & 0o777) !== 0o700 ||
    !configInfo?.isFile() || configInfo.isSymbolicLink() ||
    (configInfo.mode & 0o777) !== 0o600 || configInfo.size > 16384) {
  fail('invalid-private-input');
}
if (fs.readdirSync(tmp).length) fail('unexpected-tmp-content');
const files = [], directories = [];
let symlinks = 0, protectedFiles = 0, count = 0;
function inventory(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (++count > 200000) fail('entry-limit');
    const full = path.join(dir, entry.name);
    const s = fs.lstatSync(full);
    if (s.isSymbolicLink()) { symlinks++; continue; }
    if (full === tmp) continue;
    if (s.isDirectory()) {
      inventory(full);
      directories.push(full);
      continue;
    }
    if (!s.isFile()) fail('unexpected-special-file');
    if (s.nlink !== 1) fail('unexpected-hardlink');
    if (full === config || /^\.env(?:\.|$)/i.test(entry.name) ||
        /\.(?:pem|key|p12|pfx)$/i.test(entry.name)) {
      protectedFiles++;
      continue;
    }
    files.push([full, (s.mode & 0o111) ? 0o755 : 0o644]);
  }
}
inventory(root);
for (const [file, mode] of files) fs.chmodSync(file, mode);
for (const dir of directories) fs.chmodSync(dir, 0o755);
fs.chmodSync(root, 0o755);
const mode = p => fs.statSync(p).mode & 0o777;
if (mode(root) !== 0o755 || mode(path.join(root, 'public')) !== 0o755 ||
    mode(path.join(root, 'public/__release.json')) !== 0o644 ||
    mode(tmp) !== 0o700 || mode(config) !== 0o600) fail('postcondition');
console.log('STAGED_PERMISSIONS=PASS');
console.log('STAGED_PERMISSION_FILES=' + files.length +
  ' DIRECTORIES=' + directories.length +
  ' SYMLINKS_IGNORED=' + symlinks +
  ' PROTECTED_FILES=' + protectedFiles);
STAGE_PERMISSIONS
# Stage publish is a same-filesystem rename; live path is not touched.
[[ ! -e "$final" && ! -L "$final" ]] || fail "stage-raced"
mv "$temp" "$final"
temp=""
stage_complete=true
printf 'MANUAL_DEV_PANEL_STAGE=PASS sha=%s\n' "$sha"
printf 'STAGED_RUNTIME=%s\n' "$final"
printf 'PRIVATE_CONFIG=STAGED_WITHOUT_DISCLOSURE\n'
printf 'FREEBSD_NPM22=PASS\n'
printf 'LIVE_RUNTIME_MUTATIONS=NONE\n'
printf 'PASSENGER_RESTART=NOT_STARTED\n'
printf 'ACTIVATION=NOT_STARTED\n'
