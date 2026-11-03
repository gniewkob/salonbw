#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
temporary_directory="$(mktemp -d)"
trap 'rm -rf "$temporary_directory"' EXIT
export DEPLOY_TEST_CALLS="$temporary_directory/calls"
mkdir "$temporary_directory/bin"
cat > "$temporary_directory/bin/gh" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
if [[ "$1 $2" == 'variable list' ]]; then
  if [[ " $* " == *' --env '* ]]; then echo '[]'; exit; fi
  printf '[{"name":"MYDEVIL_PUBLIC_APP_NAME_STAGING","value":"dev.salon-bw.pl"},{"name":"MYDEVIL_PUBLIC_REMOTE_PATH_STAGING","value":"/usr/home/vetternkraft/domains/dev.salon-bw.pl/public_nodejs"},{"name":"MYDEVIL_PUBLIC_APP_NAME_PRODUCTION","value":"%s"},{"name":"MYDEVIL_PUBLIC_REMOTE_PATH_PRODUCTION","value":"/usr/home/vetternkraft/domains/salon-bw.pl/public_nodejs"},{"name":"MYDEVIL_API_APP_NAME_PRODUCTION","value":"api.salon-bw.pl"},{"name":"MYDEVIL_API_REMOTE_PATH_PRODUCTION","value":"/usr/home/vetternkraft/apps/nodejs/api_salonbw"}]\n' "${DEPLOY_TEST_PRODUCTION_APP:-dev.salon-bw.pl}"
elif [[ "$1 $2" == 'run list' ]]; then
  case "${DEPLOY_TEST_CI:-success}" in
    success) echo '[{"status":"completed","conclusion":"success"}]' ;;
    newer_failure) echo '[{"status":"completed","conclusion":"failure"},{"status":"completed","conclusion":"success"}]' ;;
    *) echo '[]' ;;
  esac
elif [[ "$1 $2" == 'workflow run' ]]; then
  printf '%s\n' "$*" >> "$DEPLOY_TEST_CALLS"
else exit 2; fi
MOCK
cat > "$temporary_directory/bin/curl" <<'MOCK'
#!/usr/bin/env bash
if [[ "${DEPLOY_TEST_CORS:-ok}" == fail ]]; then exit 22; fi
case "$*" in
  *'Origin: https://dev.salon-bw.pl'*) printf 'HTTP/2 200\r\naccess-control-allow-origin: https://dev.salon-bw.pl\r\n\r\n' ;;
  *) printf 'HTTP/2 200\r\naccess-control-allow-origin: https://salon-bw.pl\r\n\r\n' ;;
esac
MOCK
chmod +x "$temporary_directory/bin/gh" "$temporary_directory/bin/curl"
export PATH="$temporary_directory/bin:$PATH"
sha=1111111111111111111111111111111111111111
run() { bash "$root/scripts/deploy-environment.sh" "$@" > "$temporary_directory/result" 2>&1; }
must_fail() { if run "$@"; then echo "Expected refusal: $*" >&2; exit 1; fi; }

run development "$sha"
[[ ! -e "$DEPLOY_TEST_CALLS" ]]
run development "$sha" --execute
grep -Fq "ref=$sha -f environment=staging -f target=landing" "$DEPLOY_TEST_CALLS"
rm "$DEPLOY_TEST_CALLS"
must_fail development "$sha" all --execute
must_fail production "$sha" all --execute
[[ ! -e "$DEPLOY_TEST_CALLS" ]]
export DEPLOY_TEST_PRODUCTION_APP=salon-bw.pl
export DEPLOY_TEST_CI=missing
must_fail production "$sha" all --execute
export DEPLOY_TEST_CI=newer_failure
must_fail production "$sha" all --execute
export DEPLOY_TEST_CI=success DEPLOY_TEST_CORS=fail
must_fail production "$sha" all --execute
[[ ! -e "$DEPLOY_TEST_CALLS" ]]
export DEPLOY_TEST_CORS=ok
run production "$sha" all --execute
grep -Fq "ref=$sha -f environment=production -f target=all" "$DEPLOY_TEST_CALLS"
must_fail development master
echo 'deploy environment tests: 9 scenarios passed (no real dispatch)'
