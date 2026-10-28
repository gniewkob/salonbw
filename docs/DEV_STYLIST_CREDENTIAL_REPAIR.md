# DEV-only synthetic stylist credential synchronization

**Approved scope:** update `stylist@salonbw.example.test` in isolated DEV database
`p11522_salonbw_d` to match the existing GitHub `staging` secret
`E2E_ADMIN_PASSWORD`. The mismatch was established by the SELECT-only
[run #40759833580](https://github.com/gniewkob/salonbw/actions/runs/40759833580).

## Safety boundaries

- Single, exact synthetic fixture only (`role=admin`,
  `isSystemAdmin=false`), checked under a row lock.
- Verify exact DEV database/user identity and strictly pinned SSH tunnel.
- One atomic transaction: update this account's bcrypt password hash,
  increment its `authVersion`, revoke only its outstanding refresh tokens,
  then verify the new hash and absence of active refresh tokens.
- Roll back on **any** failed invariant or database operation.
- If the password already matches: `ALREADY_MATCH`, no write.
- No other users, real accounts, login-attempt history, appointments,
  notifications, booking records, production DB, or application deployments.
- No secrets, password hashes, database row data or session tokens in logs.

The script is at `scripts/ci/repair-dev-stylist-credential.cjs`. Its
mocked contract test at `scripts/ci/repair-dev-stylist-credential.test.cjs`
runs in ordinary CI without credentials or connectivity.

## Manual activation

After successful CI/security review, merge only the standalone PR
that introduces the explicitly manual workflow:

`SalonBW DEV - Repair synthetic stylist credential (approved)`

Workflow file:
`.github/workflows/repair-dev-stylist-credential.yml`.

Then run on `master` in GitHub Actions, or from authenticated GitHub CLI:

```bash
gh workflow run repair-dev-stylist-credential.yml \
  --repo gniewkob/salonbw --ref master
```

Results: `DEV_STYLIST_CREDENTIAL_REPAIR=UPDATED` means the isolated
fixture was synchronized and its old sessions invalidated.
`ALREADY_MATCH` means no write was needed. `BLOCKED` means no safe
successful update was confirmed; do not retry blindly.

Run the separate **read-only** verifier again to confirm `MATCH`.
Only then run the existing single-attempt hosted UAT 401/200/403.
Keep booking PR #1548 Draft and production NO-GO until remaining
acceptance gates pass. This workflow alone does not establish a
successful login or a production release.
