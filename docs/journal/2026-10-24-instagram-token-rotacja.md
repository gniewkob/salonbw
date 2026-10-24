# Rotacja tokenu Instagrama

- **Data:** 2026-10-24
- **Agent:** Claude Opus 5.5 (instrukcje), owner (generowanie i wgranie tokenu)
- **Commit(y):** ten commit
- **PR:** brak

## Finding

`/healthz` na produkcji: `instagram: error`,
`instagram_http_400_oauthexception_190_0` — wygasły token
`INSTAGRAM_ACCESS_TOKEN`.

## Change

Nowy długoterminowy token wygenerowany w Meta App Dashboard: aplikacja
`blackandwhite` → Use cases → „Zarządzaj wiadomościami i zawartością na
Instagramie” → Customize → **API setup with Instagram login** →
2. Generate access tokens. Konto salonu trzeba było najpierw dodać z rolą
**Instagram Tester** i zaakceptować zaproszenie na
`instagram.com/accounts/manage_access` (Tester Invites). Webhooków (punkt 3)
nie konfigurowano — backend ich nie używa.

Token wgrany przez owner skryptem, bez wypisywania wartości:
`read -rs NEW_TOKEN; printf '%s' "$NEW_TOKEN" | scripts/safe-update-instagram-token.sh --read-stdin --ssh-host devil`.

## Validation

- `https://api.salon-bw.pl/healthz`: `status ok`; database, smtp, instagram — `ok`.

## Rollout

Skrypt zaktualizował `.env` API/landingu/panelu i zrestartował domeny.

## Follow-up

- Token długoterminowy jest ważny ok. 60 dni, czyli do ok. **2026-12-23**.
  Odświeżyć wcześniej (endpoint `refresh_access_token`) — po wygaśnięciu
  pozostaje tylko ręczne generowanie jak wyżej. Do rozważenia: automatyczne
  odświeżanie.
