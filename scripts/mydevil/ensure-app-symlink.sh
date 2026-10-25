#!/usr/bin/env bash
set -euo pipefail
app_domain="${1:?Domain required}"
app_relative="${2:?Application path required}"
[[ "$app_domain" =~ ^[a-z0-9.-]+$ && "$app_relative" =~ ^apps/nodejs/[a-zA-Z0-9_-]+$ ]] || exit 2
app_root="$HOME/$app_relative"
domain_root="$HOME/domains/$app_domain/public_nodejs"
[[ -d "$HOME/domains/$app_domain" && ! -L "$HOME/domains/$app_domain" ]] || exit 2
mkdir -p "$app_root"
if [[ -L "$domain_root" ]]; then
  [[ -d "$domain_root" && "$(cd -P "$domain_root" && pwd -P)" == "$(cd -P "$app_root" && pwd -P)" ]] || { echo 'Unexpected domain symlink; refusing replacement' >&2; exit 1; }
elif [[ -e "$domain_root" ]]; then
  echo 'Domain root is a directory; provision an explicit app link before deployment' >&2
  exit 1
else
  ln -s "$app_root" "$domain_root"
fi
mkdir -p "$app_root/.diagnostics"
chmod 700 "$app_root/.diagnostics"
for artifact in index.html diagnostic_logs.txt startup_probe.txt; do
  if [[ -f "$app_root/public/$artifact" ]]; then
    private_copy="$app_root/.diagnostics/${artifact}.pre-deploy.$(date +%s).$$"
    mv "$app_root/public/$artifact" "$private_copy"
    chmod 600 "$private_copy"
  fi
done
