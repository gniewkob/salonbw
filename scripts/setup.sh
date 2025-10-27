#!/usr/bin/env sh
set -eu

# Resolve repo root even if launched via sh or a wrapper
if command -v git >/dev/null 2>&1; then
  ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
else
  # Fallback to script-relative path
  SCRIPT_DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd -P)"
  ROOT_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd -P)"
fi
cd "$ROOT_DIR"

echo "[setup] SalonBW monorepo bootstrap starting…"

# 1) Node version check
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
  case "$NODE_MAJOR" in
    ''|*[!0-9]*) NODE_MAJOR=0 ;;
  esac
  if [ "$NODE_MAJOR" -lt 20 ]; then
    echo "[setup] Warning: detected Node v$(node -v 2>/dev/null). Recommend Node >= 22." >&2
  fi
else
  echo "[setup] Node.js not found. Please install Node 22+ and re-run." >&2
  exit 1
fi

# 2) Ensure pnpm (prefer via corepack), otherwise fallback to npm
if ! command -v pnpm >/dev/null 2>&1; then
  if command -v corepack >/dev/null 2>&1; then
    echo "[setup] Activating pnpm via corepack…"
    corepack enable >/dev/null 2>&1 || true
    corepack prepare pnpm@10.14.0 --activate >/dev/null 2>&1 || true
  fi
fi

INSTALLER="pnpm"
if ! command -v pnpm >/dev/null 2>&1; then
  INSTALLER="npm"
fi

# 3) Warn if NPM_TOKEN expected but not set
if grep -q "_authToken=\${NPM_TOKEN}" "$ROOT_DIR/.npmrc" 2>/dev/null; then
  if [ "${NPM_TOKEN-}" = "" ]; then
    echo "[setup] Note: .npmrc expects NPM_TOKEN for private packages. You can ignore if not needed." >&2
  fi
fi

# 4) Install workspace dependencies
if [ "$INSTALLER" = "pnpm" ]; then
  echo "[setup] Installing workspace dependencies with pnpm…"
  pnpm install
else
  echo "[setup] Installing workspace dependencies with npm…"
  npm ci || npm install
fi

# 5) Frontend env file
if [ -f "$ROOT_DIR/frontend/.env.example" ] && [ ! -f "$ROOT_DIR/frontend/.env.local" ]; then
  echo "[setup] Creating frontend/.env.local from example…"
  cp "$ROOT_DIR/frontend/.env.example" "$ROOT_DIR/frontend/.env.local"
  if ! grep -q '^NEXT_PUBLIC_API_URL=' "$ROOT_DIR/frontend/.env.local"; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:3001" >> "$ROOT_DIR/frontend/.env.local"
  fi
fi

# 6) Backend env file (dev defaults if missing)
BACKEND_ENV="$ROOT_DIR/backend/salonbw-backend/.env"
if [ ! -f "$BACKEND_ENV" ]; then
  echo "[setup] Creating backend/salonbw-backend/.env with development defaults…"
  cat > "$BACKEND_ENV" << 'EOF'
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
FRONTEND_URL=http://localhost:3000
JWT_SECRET=dev_jwt_secret_change_me
JWT_REFRESH_SECRET=dev_refresh_secret_change_me
SMTP_HOST=mail0.mydevil.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=kontakt@salon-bw.pl
SMTP_PASSWORD=not_set
PORT=3001
NODE_ENV=development
EOF
fi

echo "[setup] Done. Next steps:"
echo "  - Start API:     pnpm --filter salonbw-backend start:dev"
echo "  - Start frontend: pnpm --filter frontend dev"
echo "  - Health check:   curl http://localhost:3001/healthz"
