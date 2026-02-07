# Improvements Documentation

## 1. Monorepo Structure & Dependencies
- **Standardized Next.js Version**: Updated `apps/landing` to Next.js v15.2.9 to match `apps/panel` and the monorepo root. This ensures consistent behavior and shared configuration possibilities.
- **Fixed Package Linking**: Replaced fragile relative `link:../../packages/api` paths with `workspace:*` protocol in both apps. This is the correct way to handle internal dependencies in pnpm monorepos, ensuring better version resolution and portability.
- **Cleaned Lockfiles**: Removed incorrect `package-lock.json` files from sub-packages (`apps/landing`, `apps/panel`). Since the project uses pnpm, only the root `pnpm-lock.yaml` should exist to manage dependencies reliably.

## 2. Code Quality & Formatting
- **Fixed JSON Syntax**: Corrected a trailing comma error in `apps/landing/package.json` that could break build tools.
- **Removed Unused Dependency**: Removed the `merge` package from `apps/landing` as it was not used in the source code and was incorrectly listed in devDependencies.

## 3. Developer Experience (DX)
- **Script Permissions**: Added executable permissions (`chmod +x`) to all shell scripts in `scripts/`. This fixes the `Permission denied` error when running maintenance scripts like `capture-versum-manual.sh`.
- **Dependency Consistency**: Ran `pnpm install` to ensure all workspaces are correctly linked and dependencies are in sync with the new configurations.

## 4. Next Steps / Recommendations
- **Typed Routes**: Consider enabling `typedRoutes: true` in `next.config.mjs` for both apps to improve type safety if compatible with the current codebase.
- **Middleware Check**: Verify `middleware.ts` compatibility with Next.js 15 caching behavior changes.

