#!/bin/sh
# Hermetic tests of the destructive legacy PHP retirement guard.
set -eu

root="$(CDPATH= cd "$(dirname "$0")/../../.." && pwd -P)"
target="$root/scripts/mydevil/retire-legacy-php-landing.sh"
tmp="$(mktemp -d)"
trap 'rm -rf -- "$tmp"' EXIT HUP INT TERM

mkdir -p "$tmp/bin" "$tmp/domains/salon-bw.pl/public_html/application/config" \
    "$tmp/apps/nodejs/salonbw_prod/.next" "$tmp/backups/legacy-salon-bw-20261025" \
    "$tmp/domains/panel.salon-bw.pl"
cat > "$tmp/bin/id" <<'STUB'
#!/bin/sh
if [ "$1" = "-un" ]; then echo vetternkraft; else /usr/bin/id "$@"; fi
STUB
cat > "$tmp/bin/curl" <<'STUB'
#!/bin/sh
exit 0
STUB
chmod 700 "$tmp/bin/id" "$tmp/bin/curl"

site="$tmp/domains/salon-bw.pl"
legacy="$site/public_html"
backup="$tmp/backups/legacy-salon-bw-20261025"
app="$tmp/apps/nodejs/salonbw_prod"
ln -s "$app" "$site/public_nodejs"
: > "$legacy/index.php"
: > "$legacy/application/config/config.php"
: > "$app/app.js"
: > "$app/.next/BUILD_ID"
: > "$backup/legacy-index.php"
: > "$tmp/backups/unrelated-database.dump"
: > "$tmp/domains/panel.salon-bw.pl/panel-app-marker"

# --audit is read-only.
HOME="$tmp" PATH="$tmp/bin:$PATH" /bin/sh "$target" --audit > /dev/null
[ -f "$legacy/index.php" ] && [ -f "$backup/legacy-index.php" ] || {
    echo "FAIL: audit touched legacy files" >&2; exit 1;
}

# --execute removes only legacy PHP root and specifically named archives.
HOME="$tmp" PATH="$tmp/bin:$PATH" /bin/sh "$target" --execute > /dev/null
[ ! -e "$legacy" ] && [ ! -e "$backup" ] || {
    echo "FAIL: legacy files were not removed" >&2; exit 1;
}
[ -f "$app/.next/BUILD_ID" ] && \
    [ -f "$tmp/backups/unrelated-database.dump" ] && \
    [ -f "$tmp/domains/panel.salon-bw.pl/panel-app-marker" ] || {
    echo "FAIL: nonlegacy file changed" >&2; exit 1;
}

# A second run must remain safe, even if the old document root is absent.
HOME="$tmp" PATH="$tmp/bin:$PATH" /bin/sh "$target" --execute > /dev/null

# Reject non-CodeIgniter document roots rather than deleting unknown content.
mkdir -p "$legacy"
: > "$legacy/index.php"
if HOME="$tmp" PATH="$tmp/bin:$PATH" /bin/sh "$target" --execute > /dev/null 2>&1; then
    echo "FAIL: unknown public_html accepted" >&2; exit 1
fi
[ -f "$legacy/index.php" ] || {
    echo "FAIL: unknown public_html was deleted" >&2; exit 1;
}

# Reject unexpected active Node symlinks; never touch either application.
rm "$site/public_nodejs"
mkdir -p "$tmp/apps/nodejs/other/.next"
ln -s "$tmp/apps/nodejs/other" "$site/public_nodejs"
if HOME="$tmp" PATH="$tmp/bin:$PATH" /bin/sh "$target" --execute > /dev/null 2>&1; then
    echo "FAIL: unexpected app symlink accepted" >&2; exit 1
fi
[ -f "$legacy/index.php" ] && [ -f "$app/.next/BUILD_ID" ] || {
    echo "FAIL: wrong symlink caused deletion" >&2; exit 1;
}

echo "PASS: audit-only, scoped removal, idempotency, marker guard, symlink guard"
