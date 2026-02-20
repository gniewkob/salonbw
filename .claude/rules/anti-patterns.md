# Anti-Patterns

## Code
- DON'T add features beyond what was asked.
- DON'T add error handling for impossible scenarios.
- DON'T create helpers/utils for one-time operations.
- DON'T use backwards-compat shims when you can just change the code.
- DON'T add docstrings/comments to unchanged code.
- DON'T engineer for hypothetical future requirements.
- DON'T mount shell/layout components per-page — put them in `_app.tsx` as persistent layout.
  Evidence: "VersumShell per-page architecture caused white screen on navigation — fundamental architectural debt"
- DON'T link tab/nav hrefs to redirect/intermediate pages — link directly to final destination.
  Evidence: "WarehouseLayout tab hrefs pointed to redirect pages (/sales, /use etc.) causing double-navigation white screen"
- DON'T call hooks after early returns (`if (!role) return null` etc.) — violates Rules of Hooks.
  Evidence: "useSetSecondaryNav hook placed after if (!role) return null early return → Rules of Hooks violation"

## Process
- DON'T commit with failing lint or typecheck.
- DON'T skip pre-commit checks "to save time".
- DON'T accept Codex commits without verifying lint — Codex (reasoning_effort=low) is known to skip checks.
  Evidence: "commit 0e93a771 had lint errors (no-misused-promises, prettier) — Codex skipped checks"
- DON'T deploy frontends before API when backend changed.
- DON'T use `devil www options <domain> nodejs_version` on this host (unsupported).
- DON'T retry a tool call that was explicitly denied; adjust approach instead.
- DON'T use background shell scripts to monitor git changes on macOS — die when parent process exits; use polling instead.
  Evidence: "Background monitoring shell scripts for git changes — die on macOS when parent process exits"

## Context & responses
- DON'T paste whole files in responses.
- DON'T restate the plan after being asked to execute.
- DON'T hallucinate rules without Evidence or Assumption tag.
- DON'T brute-force when blocked; find root cause or ask.

## Security
- DON'T commit secrets, tokens, API keys.
- DON'T log sensitive data (PII, credentials, session tokens).
- DON'T introduce command injection, XSS, SQLi, or OWASP top-10 vulns.
- DON'T push to main/master without user confirmation.
