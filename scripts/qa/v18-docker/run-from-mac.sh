#!/usr/bin/env bash
# Safe entrypoint from ANY branch in ~/Repos/salonbw on macOS.
# Uses an isolated detached worktree and a new Docker Compose project.
# Does not checkout, reset, stash or alter the owner's active worktree.
set -euo pipefail
umask 077

fail() { printf 'V18_LOCAL_DOCKER_UAT=BLOCKED (%s)\n' "$1" >&2; exit 1; }

[[ $(uname -s) == Darwin ]] || fail 'launch only on the owner Mac'
for tool in git docker mktemp; do
    command -v "$tool" >/dev/null || fail "missing $tool"
done
docker compose version >/dev/null || fail 'Docker Compose v2 is unavailable'
docker info >/dev/null || fail 'Docker daemon is not available'
[[ -z ${DOCKER_HOST:-} || ${DOCKER_HOST:-} == unix://* ]] ||
    fail 'remote Docker daemon is not authorized'
docker_endpoint=$(docker context inspect --format '{{.Endpoints.docker.Host}}' 2>/dev/null) ||
    fail 'cannot inspect Docker context'
[[ $docker_endpoint == unix://* ]] ||
    fail 'Docker context must use a local Unix socket'

repo=$(git rev-parse --show-toplevel) || fail 'must run inside salonbw checkout'
[[ $(basename "$repo") == salonbw ]] || fail 'wrong repository'
[[ $(git -C "$repo" remote get-url origin) == *gniewkob/salonbw* ]] ||
    fail 'unexpected remote'
git -C "$repo" fetch origin codex/v18-integracja-20261113
sha=$(git -C "$repo" rev-parse 'refs/remotes/origin/codex/v18-integracja-20261113^{commit}')
[[ $sha =~ ^[a-f0-9]{40}$ ]] || fail 'no exact source SHA'

# Agent scratch convention: ephemeral dirs live under ~/.agent-scratch (swept daily).
mkdir -p "$HOME/.agent-scratch"
worktree=$(mktemp -d "$HOME/.agent-scratch/salonbw-v18-docker.XXXXXXXX")
project="salonbw-v18-qa-$$"
worktree_attached=0
cleanup() {
    # Only the exact, uniquely named project created by this script.
    V18_QA_SOURCE_SHA="$sha" \
      docker compose -p "$project" -f "$worktree/scripts/qa/v18-docker/compose.yaml" \
      down --volumes --remove-orphans --rmi local >/dev/null 2>&1 || true
    if [[ $worktree_attached == 1 ]]; then
        if ! git -C "$repo" worktree remove "$worktree" >/dev/null 2>&1; then
            printf 'V18_LOCAL_DOCKER_UAT=WARNING (isolated worktree retained for review: %s)\n' "$worktree" >&2
        fi
    else
        rmdir "$worktree" 2>/dev/null || true
    fi
}
trap cleanup EXIT

git -C "$repo" worktree add --detach "$worktree" "$sha"
worktree_attached=1
test "$(git -C "$worktree" rev-parse HEAD)" = "$sha" ||
    fail 'worktree SHA mismatch'
test -z "$(git -C "$worktree" status --porcelain)" ||
    fail 'isolated worktree is not clean'

# Run cheap, dependency-free contracts BEFORE building Chromium/Next/Nest.
# A stale assertion must not waste a full Docker image build again.
# Only dependency-free node:test suites execute on the Mac; Node 20+
# supports them. Full app builds/test runtime remain pinned to Node 22
# inside the Dockerfile. Do not force the owner's default Node to v22.
node_bin=''
node_major=''
# PATH may point to an older Node while a compatible Homebrew/nvm binary
# is installed. Use the first eligible binary without changing global PATH.
for candidate in "$(command -v node || true)" \
    /opt/homebrew/opt/node@22/bin/node \
    /usr/local/opt/node@22/bin/node \
    /opt/homebrew/bin/node \
    /usr/local/bin/node \
    "$HOME"/.nvm/versions/node/v*/bin/node; do
    [[ -n $candidate && -x $candidate ]] || continue
    node_major=$("$candidate" -p 'process.versions.node.split(".")[0]' 2>/dev/null) || continue
    if [[ $node_major =~ ^[0-9]+$ ]] && (( node_major >= 20 )); then
        node_bin=$candidate
        break
    fi
done
[[ -n $node_bin ]] ||
    fail 'Node.js 20+ is required for fast QA preflight'
printf 'V18_LOCAL_DOCKER_FAST_NODE=%s\n' "$("$node_bin" --version)"
printf 'V18_LOCAL_DOCKER_FAST_PREFLIGHT=START\n'
"$node_bin" --test \
    "$worktree/scripts/ci/qa-owner-browser-pg-safety.test.mjs" \
    "$worktree/scripts/ci/v18-docker-safety.test.mjs" ||
    fail 'fast source/Compose contract tests failed'
printf 'V18_LOCAL_DOCKER_FAST_PREFLIGHT=PASS\n'

compose="$worktree/scripts/qa/v18-docker/compose.yaml"
test -f "$compose" || fail 'Compose configuration missing'
export V18_QA_SOURCE_SHA="$sha"
printf 'V18_LOCAL_DOCKER_SOURCE_SHA=%s\n' "$sha"
docker compose -p "$project" -f "$compose" config --quiet ||
    fail 'Docker Compose configuration invalid'
# Only Docker image build can reach package registries. The running QA
# containers use an internal network without published ports.
docker compose -p "$project" -f "$compose" up \
    --build --abort-on-container-exit --exit-code-from qa
