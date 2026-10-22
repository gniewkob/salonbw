# Odblokowanie bramy audytu bezpieczeństwa

- **Data:** 2026-10-22
- **Agent:** Claude Opus 5.5
- **Commit(y):** ten commit
- **PR:** #1508 (gałąź `claude/przygotowany-plan-rp46za`)
- **Poprzedza:** [weryfikacja po przestoju](2026-10-22-weryfikacja-po-przestoju.md)

## Finding

Weryfikacja z tego samego dnia wykazała, że `pnpm audit --audit-level=high`
zgłasza **24 high i 6 critical**, więc brama `Security Audit` pada na masterze,
a `deploy.yml` wymaga zielonego CI dla danego SHA. Repo było faktycznie
zamrożone — nie dało się wdrożyć niczego, w tym poprawek do importu danych.

Najpoważniejsze było **nieuwierzytelnione RCE w `next` na publicznym landingu**
(naprawione w `>=15.5.28`).

Owner zatwierdził naprawę 2026-10-22. Zrobiona w tym samym PR co dokumentacja,
bo bez niej sam PR dokumentacyjny nie mógł przejść bramy.

## Change

### Gdzie leżała naprawa

Kluczowe ustalenie: dla części pakietów decyduje **`overrides` w
`pnpm-workspace.yaml`**, a nie `package.json`. Właśnie dlatego #1507 (podnosił
`next` tylko w `package.json`) był no-opem mimo zielonego CI — override
`next: 15.5.24` wygrywał.

**`pnpm-workspace.yaml` → `overrides`:**

| Pakiet | Było | Jest | Waga |
|---|---|---|---|
| `next` | 15.5.24 | 15.5.28 | critical (RCE) + high |
| `handlebars` | ^4.7.9 | ^4.7.10 | critical ×2 |
| `axios` | ^1.18.1 | ^1.20.0 | high ×7 |
| `engine.io` | 6.6.7 | 6.6.11 | high |
| `fast-uri` | 3.1.6 | 3.1.9 | high ×2 |
| `follow-redirects` | ^1.16.0 | ^1.16.1 | high ×2 |
| `joi` | ^18.2.1 | ^18.2.6 | high |
| `sharp` | ^0.35.4 | ^0.35.5 | high |
| `brace-expansion@^5` | 5.0.9 | 5.0.12 | high ×2 |
| `proxy-addr` | — | ^2.0.8 | **critical** (nowy) |
| `compression` | — | ^1.8.2 | high (nowy) |
| `source-map-js` | — | ^1.2.2 | high (nowy) |
| `http-cache-semantics` | — | ^4.3.0 | high (nowy) |

**`package.json`:** `next` 15.5.28 w landing i panelu (zgodnie z override),
`@sentry/nextjs` ^10.75.2 w obu (critical: obejście middleware),
`dompurify` ^3.4.17 w panelu (critical + high), `nodemailer` ^10.0.6 w
backendzie (high ×2).

Lockfile wygenerowany narzędziem (`pnpm install`), nie edytowany ręcznie.

### Świadome decyzje

**`@sentry/nextjs` zostaje na linii 10.x** (10.76.2), choć najnowszy jest 11.x.
Advisory wymaga tylko `>=10.75.2`; skok majora nie był potrzebny do naprawy.

**`nodemailer` 9 → 10 to major**, ale na ścieżce, której używamy, bez ryzyka:
`emails.service.ts` woła wyłącznie `createTransport({host,port,secure,auth})`,
`sendMail({to,subject,html,from})` i `verify()`, za własnym typem
`MailTransporter`.

**Jeden wąski wyjątek: `braces` (CVE-2026-93687, GHSA-vfj7-8cjw-p6xm).**
Poprawka nie istnieje: 3.0.3 to najnowsza wersja `braces` w historii pakietu, a
`micromatch` 4.0.8 (też najnowszy) jej wymaga. Pakiet przychodzi wyłącznie
przez narzędzia deweloperskie — jest, `eslint-config-next`, `lint-staged` —
a `pnpm why braces -r --prod` znajduje go **0 razy**, więc nigdy nie trafia na
produkcję. Dodany do istniejącej listy `auditConfig.ignoreCves`, z komentarzem
w pliku, kiedy go usunąć. To decyzja bezpieczeństwa — opisana, a nie ukryta.

**Odrzucony upgrade `lint-staged` do 17.x.** Sprawdzony jako sposób usunięcia
`braces`: 17.x zastępuje `micromatch` przez `picomatch`. Ale `braces` i tak
zostaje przez jest i eslint, więc wyjątek był potrzebny niezależnie, a 17.x
wymaga Node `>=22.22.1` — ryzyko dla pre-commit hooków na maszynach
deweloperów ze starszym 22.x. Cofnięty.

Efekt uboczny regeneracji: `lint-staged` 16.2.7 → 16.4.0 — w zadeklarowanym
zakresie `^16.2.7`, **te same `engines` (`>=20.17`)**, wyłącznie dev, a przy
okazji sam porzucił `micromatch`. Pozostawiony.

### Pełna lista zmian w lockfile

Sprawdzona adwersaryjnie pod kątem cichego dryfu. Wszystkie zmiany mieszczą się
w zamierzonych rodzinach: pakiety z tabeli, `@next/*` (15.5.28), `@sentry/*`
(10.76.2, część transytywna 10.68.0), natywne `@img/sharp-*` (0.35.5 /
libvips 1.3.4) oraz `lint-staged` z jego zależnościami. Nic poza tym.

## Validation

Odtworzone kroki CI, lokalnie:

- `pnpm audit --audit-level=high` → **exit 0** — „13 moderate | 1 high
  (1 ignored)". Było: 4 low, 29 moderate, 24 high, 6 critical.
- `pnpm install --frozen-lockfile` → exit 0 (to padało w #1506).
- **Backend:** lint 0 błędów (151 ostrzeżeń, wszystkie w kodzie spoza tej
  zmiany); typecheck + `nest build` OK; **414/414 testów** — ta sama liczba co
  zapisana 2026-09-11, więc żaden test nie zniknął po cichu.
- **Realny nodemailer 10.2.1 w kształtach z `emails.service.ts`** (testy
  jednostkowe mockują transport, więc tego nie dowodzą): `createTransport` dla
  SMTP zwraca `sendMail` i `verify`; `verify()` na niedostępnym serwerze czysto
  odrzuca obietnicę (`ESOCKET`) — tego oczekuje health-check; `sendMail` z naszym
  `MailOptions` przechodzi, polskie znaki w HTML zachowane.
- **Landing i panel:** lint 0 błędów.
- **Landing:** typecheck + `next build` OK na Next 15.5.28; **70/70 testów**
  (ta sama liczba co 2026-09-11).
- **Panel:** typecheck + `next build` OK; **392/392 testów**.

Nie użyto kont ani danych klientek. Nic nie wysłano, nic nie wdrożono.

## Rollout

Po mergeu wdrożenie automatyczne (push na master). Sprawdzić **po** deployu:

1. `api/healthz` → `smtp: ok`. To potwierdza na produkcji `createTransport` +
   `verify()` na nodemailerze 10.
2. Realne wysłanie maila — najprościej test alertu o rezerwacji na wskazany
   adres. `verify()` sprawdza połączenie, nie dostarczenie.
3. Landing i panel odpowiadają; galeria nadal będzie pusta do wymiany tokenu
   Instagrama (niezależne od tej zmiany).

Po mergeu zamknąć **#1506** i **#1507** jako zastąpione — oba są niepotrzebne,
a #1507 dodatkowo mylący (zielone CI na zmianie, która nic nie instaluje).

## Follow-up

1. **Dependabot musi aktualizować `pnpm-lock.yaml`**, a dla pakietów objętych
   `overrides` — sam override. Inaczej każdy kolejny PR bezpieczeństwa powtórzy
   martwy cykl, który zostawił 24 PR-y otwarte od sierpnia.
2. Usunąć wyjątek `CVE-2026-93687`, gdy `braces` opublikuje poprawkę.
3. 13 podatności moderate — przegląd, bramka ich nie blokuje.
4. Pozostałe follow-upy z weryfikacji (odświeżanie tokenu IG, skrócenie
   `PROJECT_STATE.md`, nazwa API w `docs/ENV.md`) bez zmian.
