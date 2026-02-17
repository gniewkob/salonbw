# Anti-Patterns

## Code
- DON'T add features beyond what was asked.
- DON'T add error handling for impossible scenarios.
- DON'T create helpers/utils for one-time operations.
- DON'T use backwards-compat shims when you can just change the code.
- DON'T add docstrings/comments to unchanged code.
- DON'T engineer for hypothetical future requirements.

## Process
- DON'T commit with failing lint or typecheck.
- DON'T skip pre-commit checks "to save time".
- DON'T deploy frontends before API when backend changed.
- DON'T use `devil www options <domain> nodejs_version` on this host (unsupported).
- DON'T retry a tool call that was explicitly denied; adjust approach instead.

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
