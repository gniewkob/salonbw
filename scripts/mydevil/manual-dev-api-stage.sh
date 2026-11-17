#!/usr/bin/env bash
# MyDevil FreeBSD: install a verified DEV API bundle into a PRIVATE stage only.
# Never modifies live API, production, domains, database, or Passenger.
set -euo pipefail
umask 077

usage() {
  echo 'Usage: bash manual-dev-api-stage.sh <sha> <archive-sha256> <--plan|--execute>' >&2
  exit 2
}
fail() {
  echo "DEV_API_STAGE=BLOCKED reason=$1" >&2
  exit 1
}

# Read-only, portable tar inspection used both in host preflight and offline
# regression tests. Capture exit status; bash process substitution hides it.
verify_archive() {
  local archive="$1" names verbose entry normalized line
  local count=0 type_count=0
  [[ -f "$archive" && ! -L "$archive" ]] || fail 'archive-not-regular'
  names="$(tar -tzf "$archive")" || fail 'archive-name-list-failed'
  verbose="$(tar -tvzf "$archive")" || fail 'archive-type-list-failed'
  [[ -n "$names" && -n "$verbose" ]] || fail 'archive-empty'

  while IFS= read -r entry; do
    ((count+=1))
    ((count<=25000)) || fail 'archive-too-many-entries'
    [[ ! "$entry" =~ [[:cntrl:]] ]] || fail 'archive-control-character'
    case "$entry" in
      ./|./dist|./dist/|./dist/*|./app.js|./package.json|./.salonbw-api-release.json) ;;
      *) fail 'unexpected-archive-member' ;;
    esac
    # Tar listings from macOS and FreeBSD use a leading ./, and
    # directory entries may end in /. Ignore only those safe delimiters.
    [[ "$entry" == ./ ]] && continue
    normalized="${entry#./}"
    normalized="${normalized%/}"
    case "/$normalized/" in
      *"/../"*|*"//"*|*"/./"*) fail 'archive-parent-traversal' ;;
    esac
  done <<< "$names"
  ((count>3)) || fail 'archive-too-small'

  # BSD and GNU tar verbose listings prefix each archive member with its
  # filesystem type. Only regular files (-) and directories (d) are allowed.
  # This excludes symlinks, hardlinks, FIFO, sockets, devices and extensions
  # that would otherwise be unsafe to extract into a staged runtime.
  while IFS= read -r line; do
    ((type_count+=1))
    [[ "$line" == [-d]* ]] || fail 'archive-unsupported-type'
  done <<< "$verbose"
  ((type_count==count)) || fail 'archive-member-count-mismatch'
}

# Require an exact policy blob both in immutable candidate and approved
# origin/master, plus matching bytes on disk. Never execute unchecked files.
verify_approved_dependency_gate() {
  local git_mirror="$1" candidate_source="$2" candidate_sha="$3"
  local rel="scripts/ci/check-api-production-dependencies.cjs"
  local expected candidate disk_path disk_sha
  [[ "$candidate_sha" =~ ^[a-f0-9]{40}$ ]] || fail 'invalid-candidate-sha'
  [[ -d "$git_mirror/.git" && ! -L "$git_mirror" ]] || fail 'dependency-mirror-missing'
  expected="$(git -C "$git_mirror" rev-parse --verify "refs/remotes/origin/master:$rel" 2>/dev/null)" ||
    fail 'dependency-approved-blob-missing'
  candidate="$(git -C "$git_mirror" rev-parse --verify "$candidate_sha:$rel" 2>/dev/null)" ||
    fail 'dependency-candidate-blob-missing'
  disk_path="$candidate_source/$rel"
  [[ -f "$disk_path" && ! -L "$disk_path" ]] || fail 'dependency-source-missing'
  disk_sha="$(git hash-object "$disk_path")" || fail 'dependency-source-unreadable'
  [[ "$expected" == "$candidate" && "$candidate" == "$disk_sha" ]] ||
    fail 'dependency-source-drift'
  APPROVED_DEPENDENCY_BLOB="$expected"
}

# Pure, offline test modes never access a running application or MyDevil.
if [[ $# -eq 2 && "$1" == --verify-archive ]]; then
  verify_archive "$2"
  echo 'DEV_API_ARCHIVE_ONLY=PASS'
  exit 0
fi
if [[ $# -eq 4 && "$1" == --verify-dependency-source ]]; then
  verify_approved_dependency_gate "$2" "$3" "$4"
  echo 'DEV_API_DEPENDENCY_SOURCE_ONLY=PASS'
  exit 0
fi

[[ $# -eq 3 ]] || usage
sha="$1"
digest="$2"
mode="$3"
[[ "$sha" =~ ^[a-f0-9]{40}$ && "$digest" =~ ^[a-f0-9]{64}$ ]] || usage
[[ "$mode" == --plan || "$mode" == --execute ]] || usage

# Stateful host staging is separate from read-only plan and offline checks.
if [[ "$mode" == --execute && "${SALONBW_DEV_API_STAGE_APPROVED_SHA:-}" != "$sha" ]]; then
  fail 'unapproved-stage'
fi

[[ "$(uname -s)" == FreeBSD ]] || fail 'unsupported-operating-system'
[[ "$HOME" == /home/* || "$HOME" == /usr/home/* ]] || fail 'unexpected-home'

root="$HOME/.salonbw-manual"
source_dir="$root/sources/$sha"
incoming="$root/incoming/api-dev-$sha.tar.gz"
stage_root="$root/staged-api"
stage="$stage_root/$sha"
live="$HOME/apps/nodejs/api_salonbw_dev"
domain="$HOME/domains/dev-api.salon-bw.pl/public_nodejs"
mirror="$root/git-source"
lock_root="$root/locks"
lock="$lock_root/api-stage"

for command in node22 npm22 devil df tar git; do
  command -v "$command" >/dev/null 2>&1 || fail 'tool-missing'
done
[[ "$(node22 -p 'process.versions.node.split(".")[0]')" == 22 ]] ||
  fail 'node22-required'
for directory in "$root" "$root/incoming" "$source_dir" "$live"; do
  [[ -d "$directory" && ! -L "$directory" ]] || fail 'unexpected-directory'
done
[[ -d "$mirror/.git" && ! -L "$mirror" ]] || fail 'source-mirror-missing'
[[ -L "$domain" && -d "$domain" ]] || fail 'domain-link-missing'
[[ "$(cd -P "$live" && pwd -P)" == "$(cd -P "$domain" && pwd -P)" ]] ||
  fail 'domain-rerouted'
[[ -f "$source_dir/.salonbw-source-sha" && ! -L "$source_dir/.salonbw-source-sha" &&
  "$(cat "$source_dir/.salonbw-source-sha")" == "$sha" ]] ||
  fail 'source-receipt-mismatch'
[[ "$(git -C "$mirror" rev-parse --verify "$sha^{commit}" 2>/dev/null)" == "$sha" ]] ||
  fail 'source-commit-missing'

# Use the provider-approved quota rule, exactly as in panel staging.
quota_guard="scripts/ci/check-mydevil-dev-quota.cjs"
master_blob="$(git -C "$mirror" rev-parse "refs/remotes/origin/master:$quota_guard")" ||
  fail 'quota-policy-missing'
candidate_blob="$(git -C "$mirror" rev-parse "$sha:$quota_guard")" ||
  fail 'candidate-quota-policy-missing'
[[ "$candidate_blob" == "$master_blob" &&
  -f "$source_dir/$quota_guard" && ! -L "$source_dir/$quota_guard" &&
  "$(git hash-object "$source_dir/$quota_guard")" == "$master_blob" ]] ||
  fail 'quota-policy-drift'
account_quota="$(devil info limits)" || fail 'provider-quota-unavailable'
free_kib="$(df -Pk "$HOME" | awk 'NR == 2 {print $4}')"
[[ "$free_kib" =~ ^[0-9]+$ ]] || fail 'filesystem-quota-unavailable'
printf '%s\n' "$account_quota" |
  MYDEVIL_FILESYSTEM_FREE_KIB="$free_kib" node22 "$source_dir/$quota_guard" >/dev/null ||
  fail 'quota-below-approved-minimum'

[[ -f "$incoming" && ! -L "$incoming" ]] || fail 'archive-not-uploaded'
[[ ! -e "$stage" && ! -L "$stage" ]] || fail 'stage-already-exists'
[[ ! -L "$stage_root" && ! -L "$lock_root" ]] || fail 'unsafe-stage-parent'
[[ -f "$live/.env" && ! -L "$live/.env" ]] || fail 'dev-config-missing'

# Verify private config and host mapping before writing to disk. Never emit values.
node22 - "$live/.env" "$sha" <<'NODE' || fail 'dev-runtime-isolation-mismatch'
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const filename = process.argv[2], sha = process.argv[3];
const st = fs.lstatSync(filename);
if (!st.isFile() || st.isSymbolicLink() || st.size < 1 || st.size > 65536 ||
    (st.mode & 0o077) !== 0) process.exit(1);
const requireApp = createRequire(path.join(path.dirname(filename), 'package.json'));
const cfg = requireApp('dotenv').parse(fs.readFileSync(filename, 'utf8'));
let db;
try {db = new URL(cfg.DATABASE_URL);} catch {process.exit(1);}
if (cfg.APP_ENV !== 'development' || cfg.AUTH_COOKIE_PREFIX !== 'dev_' ||
    cfg.OUTBOUND_DELIVERY_ENABLED !== 'false' || cfg.SMSAPI_ENABLED !== 'false' ||
    cfg.DB_SYNCHRONIZE === 'true' ||
    db.hostname !== 'pgsql0.mydevil.net' ||
    decodeURIComponent(db.pathname) !== '/p11522_salonbw_d' ||
    decodeURIComponent(db.username) !== 'p11522_salonbw_d' ||
    !cfg.DEV_ACCESS_USER || !cfg.DEV_ACCESS_PASSWORD ||
    !/^[a-f0-9]{40}$/.test(sha)) process.exit(1);
NODE

actual_digest="$(node22 - "$incoming" <<'NODE'
const fs = require('node:fs'), crypto = require('node:crypto');
const hash = crypto.createHash('sha256');
const stream = fs.createReadStream(process.argv[2]);
stream.on('error', () => process.exit(1));
stream.on('data', chunk => hash.update(chunk));
stream.on('end', () => console.log(hash.digest('hex')));
NODE
)" || fail 'archive-unreadable'
[[ "$actual_digest" == "$digest" ]] || fail 'archive-digest-mismatch'

# The same validation runs in offline tests and host preflight.
verify_archive "$incoming"
verify_approved_dependency_gate "$mirror" "$source_dir" "$sha"

if [[ "$mode" == --plan ]]; then
  echo "DEV_API_STAGE_PLAN=PASS sha=$sha"
  echo 'ARCHIVE_DIGEST=PASS'
  echo 'DEV_RUNTIME_ISOLATION=PASS'
  echo 'LIVE_RUNTIME_MUTATIONS=NONE'
  echo 'DATABASE_MUTATIONS=NONE'
  echo 'PASSENGER_RESTART=NOT_STARTED'
  echo 'STAGING=NOT_STARTED'
  exit 0
fi

# Everything below writes only within ~/.salonbw-manual, never live roots.
mkdir -p "$stage_root" "$lock_root"
mkdir "$lock" 2>/dev/null || fail 'concurrent-stage'
temp=''
cleanup() {
  [[ -z "$temp" || ! -d "$temp" ]] || rm -rf -- "$temp"
  rmdir "$lock" 2>/dev/null || true
}
trap cleanup EXIT
temp="$(mktemp -d "$root/api-stage.XXXXXXXX")"
tar -xzf "$incoming" -C "$temp"
[[ -d "$temp/dist" && -f "$temp/app.js" && -f "$temp/package.json" &&
  -f "$temp/.salonbw-api-release.json" && ! -e "$temp/node_modules" &&
  ! -e "$temp/.env" ]] || fail 'invalid-api-bundle'
[[ -f "$temp/dist/src/main.js" || -f "$temp/dist/main.js" ]] ||
  fail 'compiled-main-missing'
[[ -f "$temp/dist/src/migrate.js" || -f "$temp/dist/migrate.js" ]] ||
  fail 'compiled-migration-missing'

# Verify exact SHA, environment and dependency overrides before install.
node22 - "$temp" "$sha" <<'NODE' || fail 'invalid-bundle-metadata'
const fs = require('node:fs'), path = require('node:path');
const root = process.argv[2], sha = process.argv[3];
const meta = JSON.parse(fs.readFileSync(path.join(root, '.salonbw-api-release.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (meta.sha !== sha || meta.target !== 'api' ||
    meta.environment !== 'development' || manifest.name !== 'salonbw-backend')
  process.exit(1);
NODE
# Get a byte-pinned policy directly from the verified Git mirror.
# This avoids a source_dir time-of-check/time-of-use replacement.
approved_checker="$temp/.approved-api-dependency-gate.cjs"
git -C "$mirror" cat-file blob "$APPROVED_DEPENDENCY_BLOB" > "$approved_checker" ||
  fail 'dependency-approved-blob-unreadable'
[[ "$(git hash-object "$approved_checker")" == "$APPROVED_DEPENDENCY_BLOB" ]] ||
  fail 'dependency-approved-blob-mismatch'
node22 "$approved_checker" \
  --manifest-only "$temp/package.json" >/dev/null ||
  fail 'dependency-manifest-gate'

# Copy the existing DEV environment into the staged runtime, updating only
# the release marker. Keep all secrets off stdout and the transport archive.
node22 - "$live/.env" "$temp/.env" "$sha" <<'NODE' || fail 'private-runtime-stage-failed'
const fs = require('node:fs');
const source = process.argv[2], target = process.argv[3], sha = process.argv[4];
let raw = fs.readFileSync(source, 'utf8');
const match = /^\s*APP_RELEASE\s*=.*$/gm;
if (match.test(raw)) {
  raw = raw.replace(match, 'APP_RELEASE=' + sha);
} else {
  raw += (raw.endsWith('\n') ? '' : '\n') + 'APP_RELEASE=' + sha + '\n';
}
fs.writeFileSync(target, raw, {mode:0o600,flag:'wx'});
NODE
cd "$temp"
node22 --check app.js >/dev/null || fail 'invalid-entrypoint'
npm22 install --omit=dev --ignore-scripts --no-package-lock \
  --no-audit --no-fund --loglevel=error ||
  fail 'freebsd-dependencies-install-failed'
node22 "$approved_checker" >/dev/null ||
  fail 'installed-dependencies-gate'
# FreeBSD bcrypt may require an explicit native rebuild.
if ! node22 -e "require('bcrypt')" >/dev/null 2>&1; then
  MAKE=gmake npm_config_build_from_source=true npm22 rebuild bcrypt \
    --no-audit --no-fund --loglevel=error ||
    fail 'bcrypt-native-build-failed'
fi
node22 - <<'NODE' || fail 'bcrypt-native-smoke-failed'
const bcrypt = require('bcrypt');
bcrypt.hash('synthetic-runtime-test', 4)
  .then(hash => bcrypt.compare('synthetic-runtime-test', hash))
  .then(ok => {if (!ok) process.exitCode=1;})
  .catch(() => {process.exitCode=1;});
NODE
node22 - <<'NODE' || fail 'sharp-freebsd-codec-smoke-failed'
(async () => {
  const sharp = require('sharp');
  for (const format of ['jpeg','png','webp']) {
    const buffer = await sharp({create:{
      width:160,height:80,channels:3,background:'#888888'
    }}).toFormat(format).toBuffer();
    const result = await sharp(buffer).resize(80,40).jpeg().toBuffer();
    const meta = await sharp(result).metadata();
    if (meta.format !== 'jpeg' || meta.width !== 80 || meta.height !== 40)
      throw Error('codec-smoke-failed');
  }
})().catch(() => {process.exitCode=1;});
NODE

# Never ship the internal policy script as an application runtime file.
rm -f -- "$approved_checker"
[[ ! -e "$stage" && ! -L "$stage" ]] || fail 'stage-created-concurrently'
mv "$temp" "$stage"
temp=''
echo "DEV_API_STAGE=PASS sha=$sha"
echo 'FREEBSD_NATIVE_DEPENDENCIES=PASS'
echo 'API_DEPENDENCY_GATE=PASS'
echo 'PRIVATE_DEV_CONFIG=COPIED'
echo 'LIVE_RUNTIME_MUTATIONS=NONE'
echo 'DATABASE_MUTATIONS=NONE'
echo 'PASSENGER_RESTART=NOT_STARTED'
echo 'ACTIVATION=NOT_STARTED'
