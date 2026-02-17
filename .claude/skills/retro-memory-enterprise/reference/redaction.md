# Redaction Policy (mandatory)

## Do NOT store
- Tokens, API keys, passwords, secrets, JWTs
- Personal identifiers not needed for collaboration
- Production credentials, SSH keys, private certificates

## Patterns to redact
- Anything matching: `Bearer .*`, `token\s*[:=]\s*\S+`, `AKIA[0-9A-Z]{16}`, `-----BEGIN .* PRIVATE KEY-----`
- Any `.env` values with sensitive names: JWT_SECRET, DB_PASSWORD, etc.

## If encountered
1. Replace value with: `[REDACTED]`
2. Add bullet in evidence-ledger under "## Redactions":
   - `Redaction: <type of credential> detected and removed from <context>.`
3. Do NOT include the original value anywhere, including in comments or examples.

## Escalation
If a live production secret is found in repo files, stop and instruct user to rotate/revoke immediately before proceeding.
