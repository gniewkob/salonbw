Super — poniżej masz gotowy, uporządkowany „runbook” dla Codex CLI, który:

* sam sprawdza co już masz w repo i **nie dubluje pracy**,
* tworzy brakujące pliki konfiguracyjne dla **dev (macOS) / CI/CD / prod (mydevil)**,
* konfiguruje **tunel SSH do bazy** w dev i w CI,
* generuje dokumentację (`*.md`),
* uruchamia testy i blokuje merge jeśli coś nie przechodzi.

Wklejasz **prompt po promcie** (P0 → P1 → …). Każdy prompt ma: **cel, kroki, pliki do zmiany, testy akceptacyjne, politykę “respect existing work”**.

---

# P0 — Repository baseline & guardrails

**Prompt do Codex (wklej):**

> **Goal:** Audit the repo (monorepo FE+BE) and establish a baseline without changing behavior.
> **Respect existing work:** If a file/config already implements an equivalent or better solution, do **not** re-write it; only annotate deltas in a report.
> **Tasks:**
>
> 1. Detect package manager (prefer `pnpm`), Node version, workspace layout, FE framework (Next.js), BE (NestJS).
> 2. Create/refresh high-level docs:
>
>    * `docs/ARCHITECTURE.md` (current state, not the target)
>    * `docs/CONTRIBUTING.md` (commit style, PR flow)
>    * `docs/SECURITY.md` (secrets handling, no secrets in repo)
> 3. Add repo checks: if missing, add:
>
>    * root `.editorconfig`, `.gitattributes`, `.npmrc` (`strict-peer-dependencies=true`), `.nvmrc` (Node 22)
>    * ESLint/Prettier baseline in root (or confirm existing)
> 4. Output a short **baseline report** to `docs/AUDIT-P0.md`.
>    **Acceptance:** `pnpm -v` resolves; `pnpm i` completes without warnings (or warnings are justified in `AUDIT-P0.md`); no code changes that alter runtime behavior.

---

# P1 — macOS dev setup + toolchain

**Prompt do Codex:**

> **Goal:** Prepare a first-time dev on macOS (Apple Silicon / Intel) with minimal friction.
> **Respect existing work.**
> **Tasks:**
>
> 1. Create `docs/DEV_SETUP_MAC.md` with:
>
>    * Homebrew install; `brew install nvm pnpm git openssl`
>    * Node 22 via `nvm use` (from `.nvmrc`)
>    * `pnpm i` at repo root; how to run FE/BE dev servers.
> 2. Add VSCode recommendations: `.vscode/extensions.json` (ESLint, Tailwind, Prisma/TypeORM tools), `.vscode/settings.json` (format on save, eslint).
> 3. Husky + lint-staged if missing (pre-commit: `pnpm lint --fix`, `pnpm typecheck`).
>    **Acceptance:** `pnpm lint` and `pnpm typecheck` pass locally; dev guide clearly reproducible.

---

# P2 — Dev env: SSH tunnel do bazy (mydevil) + env templates

**Prompt do Codex:**

> **Goal:** Make DB available locally through an SSH tunnel (dev/test). Direct DB access is **only** in prod.
> **Respect existing work.**
> **Tasks:**
>
> 1. Create scripts:
>
>    * `scripts/db-tunnel.sh` — opens tunnel: `ssh -f $MYDEVIL_SSH_USER@$MYDEVIL_SSH_HOST -L $DB_LOCAL_PORT:$MYDEVIL_PG_HOST:$MYDEVIL_PG_PORT -N`
>    * `scripts/db-tunnel-kill.sh` — cleanly kills tunnel.
> 2. Add `.env.development.local.example` and `.env.test.local.example` with:
>
>    ```
>    DB_LOCAL_PORT=8543
>    MYDEVIL_SSH_HOST=s0.mydevil.net
>    MYDEVIL_SSH_USER=<login>
>    MYDEVIL_PG_HOST=pgsql0.mydevil.net
>    MYDEVIL_PG_PORT=5432
>    DATABASE_URL=postgresql://<user>:<pass>@localhost:8543/<db>
>    NEXT_PUBLIC_API_URL=https://api.salon-bw.pl
>    ```
> 3. Root `package.json` scripts:
>
>    * `"tunnel:start": "bash scripts/db-tunnel.sh"`
>    * `"tunnel:stop": "bash scripts/db-tunnel-kill.sh"`
> 4. `docs/TUNNELING.md` (how it works, troubleshooting).
>    **Acceptance:** `pnpm tunnel:start` opens tunnel; BE connects using `DATABASE_URL` (localhost:8543); simple `SELECT 1` passes in healthcheck.

---

# P3 — Backend env wiring + healthcheck

**Prompt do Codex:**

> **Goal:** Ensure BE reads DB/env from `.env*`, exposes `/healthz`, and fails fast if env is invalid.
> **Respect existing work.**
> **Tasks:**
>
> 1. Confirm `.env` parsing (`@nestjs/config` or equivalent). Add `ENV.md` listing all required vars.
> 2. Add `/healthz` GET ready for CI smoke test (DB ping + version).
> 3. Add `pnpm be:dev` and `pnpm be:test` scripts (with tunnel note).
>    **Acceptance:** `curl http://localhost:<be-port>/healthz` returns 200 with JSON `{status:'ok'}`; unit tests green.

---

# P4 — Frontend security + headers + robots (public vs panel)

**Prompt do Codex:**

> **Goal:** Public and panels use different headers/robots, noindex on panels, CSP in place.
> **Respect existing work.**
> **Tasks:**
>
> 1. Public app: `next.config.mjs` security headers (CSP, X-Frame-Options DENY, etc.), `public/robots.txt` allow index.
> 2. Dashboard/Admin app: headers as wyżej + `X-Robots-Tag: noindex, nofollow`, `public/robots.txt` disallow.
> 3. `docs/SECURITY_HEADERS.md` (rationale).
>    **Acceptance:** `pnpm build` succeeds; headers are visible in dev/prod server responses; Lighthouse SEO≥90 for public.

---

# P5 — CI/CD skeleton (GitHub Actions) + SSH tunnel in CI e2e

**Prompt do Codex:**

> **Goal:** Create CI that lints, type-checks, tests, builds; e2e uses SSH tunnel; deploy jobs prepared (no secrets in repo).
> **Respect existing work.**
> **Tasks:**
>
> 1. `.github/workflows/ci.yml`:
>
>    * matrix per app (`public`, `dashboard`, `admin`) gated by changed paths,
>    * steps: checkout → setup pnpm/node → `pnpm i` → `pnpm turbo run lint typecheck test build --filter=<app>`.
> 2. `e2e.yml`: start SSH tunnel (using `MYDEVIL_*` secrets), run Cypress/Playwright smoke tests (login, list, create+rollback appointment), kill tunnel.
> 3. `deploy_*.yml` **only as templates** (commented `rsync` to mydevil `public_nodejs/` + `devil www restart`); **do not run on PRs**.
> 4. `docs/CI_CD.md` with required secrets: `MYDEVIL_SSH_HOST/USER/KEY/KNOWN_HOSTS`, `MYDEVIL_PG_*`, `NEXT_PUBLIC_API_URL`, (opcjonalnie Sentry, Cypress keys).
>    **Acceptance:** CI green on branch; e2e smoke runs via tunnel and passes.

---

# P6 — OpenAPI client + data layer cache

**Prompt do Codex:**

> **Goal:** FE uses generated OpenAPI types + TanStack Query with invalidations.
> **Respect existing work.**
> **Tasks:**
>
> 1. `packages/api`: script `"gen:api"` (openapi-typescript) z `openapi.json` BE; commit `schema.ts`.
> 2. Lightweight `api.ts` (fetch + credentials include + 401 handling).
> 3. Example hooks (appointments/services/products): `useAppointments`, `useCreateAppointment` (invalidates `['appointments']`).
> 4. Document `docs/API_CLIENT.md`.
>    **Acceptance:** `pnpm gen:api` works; FE compiles; example screens use query hooks; no runtime regressions.

---

# P7 — RBAC guards (UI) + routing separation (public vs panels)

**Prompt do Codex:**

> **Goal:** Strict split public vs panels; guards enforce roles: `client`, `employee` (w/ receptionist privs), `admin`.
> **Respect existing work.**
> **Tasks:**
>
> 1. Route middleware: unauth → redirect to login; unauthorized role → 403 screen.
> 2. `packages/utils/access.ts` with `can(role, permission)` helpers and usage in UI.
> 3. Navigation renders correct menus per context; no public assets bleed into panels.
>    **Acceptance:** E2E covers: public → login → dashboard (client), employee, admin; forbidden screens hidden; direct URL returns 403.

---

# P8 — Docs for developers & runbooks

**Prompt do Codex:**

> **Goal:** Create living docs for onboarding and releases.
> **Respect existing work.**
> **Tasks:**
>
> 1. `docs/README_DEV.md` (quickstart),
> 2. `docs/RELEASE_CHECKLIST.md` (secrets, DNS, build flags, smoke tests),
> 3. `docs/DEPLOYMENT_MYDEVIL.md` (Passenger, `app.js`, standalone upload, cache/processes).
>    **Acceptance:** New dev can follow docs to run app with tunnel in <15 min.

---

# P9 — Production build (standalone) + mydevil runtime

**Prompt do Codex:**

> **Goal:** Ensure each app builds with `output:'standalone'` and boot via Passenger.
> **Respect existing work.**
> **Tasks:**
>
> 1. In each Next app: `next.config.mjs` with `output:'standalone'`, `images.unoptimized=true` (FreeBSD friendly), `experimental.typedRoutes=true`.
> 2. Add `app.js` in deployment root (Passenger):
>
>    ```js
>    process.env.NODE_ENV='production';
>    process.env.PORT = process.env.PORT || process.env.PASSENGER_PORT || '3000';
>    require('./.next/standalone/server.js');
>    ```
> 3. Add deploy script templates `scripts/deploy-*.sh` using `rsync` to `public_nodejs/` and `devil www restart`.
>    **Acceptance:** Local `pnpm build` produces `.next/standalone`; `node app.js` runs locally; doc updated.

---

# P10 — Quality gates: lint rules, form stack, perf budgets

**Prompt do Codex:**

> **Goal:** Enforce **React Hook Form + Zod** (no new Formik/Yup), perf budgets, and warn on bundle bloat.
> **Respect existing work.**
> **Tasks:**
>
> 1. ESLint rule `no-restricted-imports` for `formik*`/`yup*` (error).
> 2. Add `bundlewatch`/`@next/bundle-analyzer` in CI (warn if public initial > 250 kB).
> 3. Add `pnpm audit:deps` and schedule weekly CI.
>    **Acceptance:** CI fails on Formik import; size report printed on PR.

---

# P11 — Autonomiczna orkiestracja zadań dla Codex CLI

**Prompt do Codex:**

> **Goal:** Create a lightweight task runner description so Codex can process tasks sequentially with checkpoints.
> **Tasks:**
>
> 1. Add `.codex/tasks/P0-P10.md` — one file per prompt containing: context, steps, acceptance checks, rollback.
> 2. Add `.codex/queue.json` with an ordered list: `["P0","P1","P2",...,"P10"]`.
> 3. Create `scripts/codex-run.sh` that: reads queue, feeds each `.md` to Codex CLI, halts on failure, writes `reports/<task>.md`.
> 4. Document in `docs/CODEX_AGENT.md` how to run locally and in CI (dry-run vs apply).
>    **Acceptance:** `bash scripts/codex-run.sh` processes P0 → P1… and stops on unmet acceptance, producing a clear report.

---

## Jak to uruchamiać lokalnie (Twoje kroki)

1. Upewnij się, że masz **pnpm** i **Node 22** (`nvm use`).
2. Odpal **P0** w Codex CLI, potem kolejne P-prompty po zielonym raporcie.
3. Przed **P2** ustaw w `.env.development.local` wartości do tunelu (login/host).
4. Po **P5** dodaj sekrety w GitHub (tak jak w `docs/CI_CD.md`).
5. Po **P9** zrób testowy deploy na subdomenie staging (te same kroki rsync/Passenger).

---

## Notatki końcowe / decyzje techniczne

* Każdy prompt wymusza **„respect existing work”** i **100% testów** (unit/e2e).
* Wszędzie, gdzie coś już działa lepiej niż proponujemy, Codex ma **zostawić** i tylko opisać różnice w raporcie.
* Tunel SSH w CI ograniczamy do **e2e** (krótkie życie tunelu, `pkill -f` w `finally`).
* Public vs Panel: różne robots, nagłówki, cache; spójny **design system** w `packages/ui`.


