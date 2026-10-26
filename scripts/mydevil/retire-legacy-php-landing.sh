#!/bin/sh
# Retire the inactive CodeIgniter/PHP landing after canonical cutover to Next.js.
# FreeBSD /bin/sh; run on MyDevil as the 'vetternkraft' account.
# Does NOT change WWW/DNS/PHP settings, PostgreSQL/MySQL, mail, API or Node apps.
#
# Read-only: sh scripts/mydevil/retire-legacy-php-landing.sh --audit
# Purge:     sh scripts/mydevil/retire-legacy-php-landing.sh --execute
#
# Only the exact, verified legacy document root and the known legacy backup
# naming pattern are candidates. No globbed app directories are ever removed.
set -eu
umask 077

MODE=${1:---audit}
case "$MODE" in
    --audit|--execute) ;;
    *) echo "Usage: $0 [--audit|--execute]" >&2; exit 64 ;;
esac
[ "$#" -eq 1 ] || { echo "One mode argument required" >&2; exit 64; }

[ "$(id -un)" = "vetternkraft" ] || {
    echo "REFUSED: execute only as the MyDevil account 'vetternkraft'." >&2
    exit 1
}
[ -n "${HOME:-}" ] && [ -d "$HOME/domains/salon-bw.pl" ] || {
    echo "REFUSED: expected MyDevil domain home not found." >&2
    exit 1
}

site="$HOME/domains/salon-bw.pl"
node="$site/public_nodejs"
expected="$HOME/apps/nodejs/salonbw_prod"
legacy="$site/public_html"

[ -L "$node" ] || {
    echo "REFUSED: production public_nodejs is not a symlink." >&2
    exit 1
}
[ -d "$expected" ] || { echo "REFUSED: production Next.js root missing." >&2; exit 1; }

actual_node="$(cd "$node" && pwd -P)"
actual_expected="$(cd "$expected" && pwd -P)"
[ "$actual_node" = "$actual_expected" ] || {
    echo "REFUSED: public_nodejs does not point to salonbw_prod." >&2
    exit 1
}
[ -f "$actual_node/app.js" ] && [ -f "$actual_node/.next/BUILD_ID" ] || {
    echo "REFUSED: expected live Next.js app.js/BUILD_ID missing." >&2
    exit 1
}

# Require the live canonical Node routes to answer before touching old files.
for path in / /privacy /policy /data-deletion; do
    if ! curl --silent --show-error --fail --max-time 15 \
        --output /dev/null "https://salon-bw.pl$path"; then
        echo "REFUSED: production endpoint $path is not healthy." >&2
        exit 1
    fi
done

echo "PASS: production Node.js symlink and four public routes verified."
echo "Mode: $MODE"
echo "Active Next.js application (PRESERVED): $actual_node"

if [ -e "$legacy" ] || [ -L "$legacy" ]; then
    [ -d "$legacy" ] && [ ! -L "$legacy" ] || {
        echo "REFUSED: public_html is not a real directory." >&2
        exit 1
    }
    actual_legacy="$(cd "$legacy" && pwd -P)"
    actual_site="$(cd "$site" && pwd -P)"
    [ "$actual_legacy" = "$actual_site/public_html" ] || {
        echo "REFUSED: unexpected legacy path: $actual_legacy" >&2
        exit 1
    }
    if [ ! -f "$legacy/index.php" ] || [ ! -f "$legacy/application/config/config.php" ]; then
        echo "REFUSED: public_html lacks old CodeIgniter signature; manual inventory required." >&2
        exit 1
    fi
    echo "Legacy CodeIgniter document root: $actual_legacy"
    du -sh "$legacy"
else
    echo "Legacy CodeIgniter document root: already absent."
fi

# Legacy backups only: do NOT purge global backups, database snapshots, uploads.
# Every candidate must match the exact naming pattern inside ~/backups.
backup_root="$HOME/backups"
if [ -d "$backup_root" ] && [ ! -L "$backup_root" ]; then
    actual_backup_root="$(cd "$backup_root" && pwd -P)"
    actual_home="$(cd "$HOME" && pwd -P)"
    [ "$actual_backup_root" = "$actual_home/backups" ] || {
        echo "REFUSED: backup root redirected outside account." >&2
        exit 1
    }
    for item in "$backup_root"/legacy-salon-bw-*; do
        [ -e "$item" ] || [ -L "$item" ] || continue
        [ ! -L "$item" ] || { echo "REFUSED: symlink archive $item" >&2; exit 1; }
        echo "Legacy backup candidate: $item"
        du -sh "$item"
    done
fi

if [ "$MODE" = "--audit" ]; then
    echo "AUDIT ONLY: no files were removed."
    echo "Run again with --execute after reviewing the exact candidates."
    exit 0
fi

if [ -d "$legacy" ]; then
    rm -rf -- "$legacy"
    [ ! -e "$legacy" ] || { echo "ERROR: public_html still exists." >&2; exit 1; }
    echo "REMOVED: $legacy"
fi

if [ -d "$backup_root" ] && [ ! -L "$backup_root" ]; then
    for item in "$backup_root"/legacy-salon-bw-*; do
        [ -e "$item" ] || continue
        [ ! -L "$item" ] || { echo "REFUSED: symlink archive $item" >&2; exit 1; }
        case "$item" in
            "$backup_root"/legacy-salon-bw-*) rm -rf -- "$item" ;;
            *) echo "REFUSED: unexpected backup path." >&2; exit 1 ;;
        esac
        [ ! -e "$item" ] || { echo "ERROR: archive still exists: $item" >&2; exit 1; }
        echo "REMOVED: $item"
    done
fi

# Keep the SEO redirect middleware and old URL mapping in the Next.js app.
[ -f "$actual_node/app.js" ] && [ -f "$actual_node/.next/BUILD_ID" ] || {
    echo "ERROR: production Next.js root changed." >&2
    exit 1
}
echo "COMPLETE: inactive PHP landing removed; production Next.js preserved."
echo "Any private archive outside ~/backups/legacy-salon-bw-* requires separate path-specific review."
