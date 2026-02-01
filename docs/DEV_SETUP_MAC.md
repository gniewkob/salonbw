# macOS Development Setup

These steps walk a first–time contributor through preparing a macOS machine (Apple Silicon or Intel) for working on Salon Black & White.

## 1. Install Homebrew and Required Tools

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew update
brew install nvm pnpm git openssl
```

> Homebrew installs under `/opt/homebrew` on Apple Silicon and `/usr/local` on Intel. Follow the on‑screen instructions to add it to your shell profile.

## 2. Configure Node.js via nvm

```bash
mkdir -p ~/.nvm
export NVM_DIR="$HOME/.nvm"
source "$(brew --prefix nvm)/nvm.sh"

cd /path/to/salonbw
nvm install
nvm use            # reads version from .nvmrc (Node 22)
```

If you still have Node 20 cached locally (from previous setup), run `nvm uninstall 20` to avoid conflicts.

## 3. Clone the Repository

```bash
git clone git@github.com:gniewkob/salonbw.git
cd salonbw
```

## 4. Install Dependencies with pnpm

The repository is configured as a pnpm workspace.

```bash
pnpm install
```

This installs dependencies for both Next.js apps (`apps/landing/`, `apps/panel/`) and the backend (`backend/salonbw-backend/`) workspace. If you receive `NPM_TOKEN` warnings, provide a token or set a dummy value (e.g. `export NPM_TOKEN=unused`) for local development.

## 5. Environment Variables

Copy the relevant templates and fill in values:

```bash
cp apps/landing/.env.local.example apps/landing/.env.local
cp apps/panel/.env.local.example apps/panel/.env.local
cp backend/salonbw-backend/.env.example backend/salonbw-backend/.env
```

For advanced workflows (DB tunnelling, CI), additional `.env.*.example` files will be introduced in later runbook steps.

## 6. Running the Applications

### Landing (Next.js public site)

```bash
pnpm --filter @salonbw/landing dev  # starts the dev server with smart port management
```

Visit the URL printed by the dev server (typically <http://localhost:3000>). Use `pnpm lint`, `pnpm test`, and `pnpm e2e` for linting, unit tests, and Cypress tests respectively.

### Panel (Next.js dashboard)

```bash
pnpm --filter @salonbw/panel dev  # starts the dev server with smart port management
```

Visit the URL printed by the dev server (typically the next free port after 3000).

### Backend (NestJS)

```bash
# Quick start from the repo root
pnpm be:dev

# Or run manually inside the backend workspace
cd backend/salonbw-backend
pnpm start:dev  # watches for changes
```

Ensure your `.env` (or `.env.development.local`) contains valid PostgreSQL credentials. Health endpoints: <http://localhost:3001/health> and <http://localhost:3001/healthz>.

## 7. Recommended IDE Setup (VS Code)

Open the repository in VS Code. The workspace includes recommended extensions and settings (auto-format, ESLint integration, Tailwind tooling). Accept the prompts to install extensions when asked.

## 8. Git Hooks (Husky & lint-staged)

Git hooks run automatically after `pnpm install`. They enforce:

- `pnpm lint --fix`
- `pnpm typecheck`

If a hook fails, fix the reported issues before committing.

## 9. Troubleshooting

- **Node version mismatch:** Run `nvm use` at the repo root. If errors persist, clear `.npmrc` auth token or export `NPM_TOKEN=unused`.
- **Permission denied on hooks:** Ensure the repo directory is not on a restricted volume. Re-run `pnpm install` to reinstall Husky hooks.
- **Cypress binary missing:** Run `pnpm --filter @salonbw/landing cypress:install` or `pnpm --filter @salonbw/panel cypress:install`.

You’re ready to develop! Proceed with the runbook to configure additional tooling (SSH tunnels, CI/CD, etc.).
