#!/usr/bin/env bash
# MyDevil source transfer when GitHub Actions cannot start.
# --sync never changes any live app, secrets, database, or domain link.
set -euo pipefail
umask 077

usage() {
  echo "Usage: bash git-source-sync.sh <branch> <40-char-sha> <--check|--sync>" >&2
  exit 2
}
[[ $# -eq 3 ]] || usage
branch="$1"
expected_sha="$2"
mode="$3"
[[ "$expected_sha" =~ ^[a-f0-9]{40}$ ]] || usage
[[ "$branch" =~ ^[a-zA-Z0-9][a-zA-Z0-9_./-]*$ ]] || usage
[[ "$branch" != *..* && "$branch" != */ && "$branch" != *//* ]] || usage
[[ "$mode" == --check || "$mode" == --sync ]] || usage

origin="https://github.com/gniewkob/salonbw.git"
remote_ref="refs/heads/$branch"
command -v git >/dev/null || { echo "git unavailable on MyDevil" >&2; exit 1; }

# Read-only path: no local files, no MyDevil app modification.
remote_sha="$(git ls-remote "$origin" "$remote_ref" | awk -v ref="$remote_ref" '$2 == ref {print $1}')"
[[ "$remote_sha" =~ ^[a-f0-9]{40}$ ]] || {
  echo "Branch not found or unavailable on GitHub" >&2
  exit 1
}
if [[ "$remote_sha" != "$expected_sha" ]]; then
  echo "Remote branch HEAD differs from the approved source SHA" >&2
  exit 1
fi
if [[ "$mode" == --check ]]; then
  printf 'SOURCE_CHECK=PASS branch=%s sha=%s (read-only)\n' "$branch" "$expected_sha"
  exit 0
fi

for tool in node22 devil df tar mktemp; do
  command -v "$tool" >/dev/null || {
    echo "Required MyDevil tool unavailable: $tool" >&2
    exit 1
  }
done

root="$HOME/.salonbw-manual"
mirror="$root/git-source"
sources="$root/sources"
[[ ! -L "$root" && ! -L "$mirror" && ! -L "$sources" ]] || {
  echo "Unexpected source workspace symlink" >&2
  exit 1
}
mkdir -p "$root" "$sources"
chmod 700 "$root" "$sources"

# Use a separate Git mirror. Never checkout into live apps/nodejs or domains.
if [[ ! -e "$mirror" ]]; then
  mkdir "$mirror"
  git -C "$mirror" init -q
  git -C "$mirror" remote add origin "$origin"
fi
[[ -d "$mirror/.git" ]] || {
  echo "Unexpected source mirror structure" >&2
  exit 1
}
[[ "$(git -C "$mirror" remote get-url origin)" == "$origin" ]] || {
  echo "Unexpected source mirror origin" >&2
  exit 1
}

if [[ "$branch" == master ]]; then
  git -C "$mirror" fetch --no-tags origin \
    "+refs/heads/master:refs/remotes/origin/master"
else
  git -C "$mirror" fetch --no-tags origin \
    "+$remote_ref:refs/remotes/origin/$branch" \
    "+refs/heads/master:refs/remotes/origin/master"
fi
fetched_sha="$(git -C "$mirror" rev-parse "refs/remotes/origin/$branch^{commit}")"
[[ "$fetched_sha" == "$expected_sha" ]] || {
  echo "Branch moved during fetch; refusing outdated source" >&2
  exit 1
}

# The policy comes from current master, not the branch being transferred.
provider_output="$(devil info limits)" || {
  echo "MyDevil provider disk quota cannot be read" >&2
  exit 1
}
filesystem_free_kib="$(df -Pk "$HOME" | awk 'NR == 2 {print $4}')"
[[ "$filesystem_free_kib" =~ ^[0-9]+$ ]] || {
  echo "MyDevil filesystem capacity cannot be read" >&2
  exit 1
}
policy_dir="$(mktemp -d "$root/quota.XXXXXXXX")"
tmp_checkout=""
cleanup() {
  if [[ -n "$tmp_checkout" && -d "$tmp_checkout" ]]; then
    rm -rf "$tmp_checkout"
  fi
  rm -rf "$policy_dir"
}
trap cleanup EXIT

git -C "$mirror" show \
  "refs/remotes/origin/master:scripts/ci/check-mydevil-dev-quota.cjs" \
  > "$policy_dir/qa.cjs" || {
    echo "Current master has no approved quota guard" >&2
    exit 1
  }
printf '%s\n' "$provider_output" |
  MYDEVIL_FILESYSTEM_FREE_KIB="$filesystem_free_kib" \
  node22 "$policy_dir/qa.cjs" >/dev/null || {
    echo "Provider or filesystem quota below 4 GiB or unreadable" >&2
    exit 1
  }

source_dir="$sources/$expected_sha"
if [[ -e "$source_dir" || -L "$source_dir" ]]; then
  [[ -d "$source_dir" && ! -L "$source_dir" ]] || {
    echo "Unexpected release source path" >&2
    exit 1
  }
  [[ -f "$source_dir/.salonbw-source-sha" ]] || {
    echo "Existing release directory has no source receipt" >&2
    exit 1
  }
  [[ "$(cat "$source_dir/.salonbw-source-sha")" == "$expected_sha" ]] || {
    echo "Existing release source has mismatched SHA" >&2
    exit 1
  }
else
  tmp_checkout="$(mktemp -d "$root/source.XXXXXXXX")"
  git -C "$mirror" archive "$expected_sha" | tar -xf - -C "$tmp_checkout"
  [[ -f "$tmp_checkout/pnpm-lock.yaml" ]] || {
    echo "Release missing pnpm workspace lockfile" >&2
    exit 1
  }
  printf '%s\n' "$expected_sha" > "$tmp_checkout/.salonbw-source-sha"
  mv "$tmp_checkout" "$source_dir"
  tmp_checkout=""
fi
printf 'SOURCE_SYNC=PASS branch=%s sha=%s\n' "$branch" "$expected_sha"
printf 'SOURCE_DIR=%s\n' "$source_dir"
echo 'DEPLOYMENT=NOT_STARTED (running apps and DB unchanged)'
