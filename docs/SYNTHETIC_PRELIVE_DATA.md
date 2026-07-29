# Syntetyczne dane przed live

## Decyzja

Do czasu jawnego otwarcia systemu nie importujemy zrzutu klientów ani magazynu
z Versum. Zrzut pozostaje offline. Panel używa deterministycznego, pozbawionego
danych osobowych zestawu syntetycznego.

Narzędzie nie jest migracją TypeORM i nie uruchamia się podczas deployu.
Każde użycie jest osobną, audytowalną operacją operatorską.

## Zakres

`apply` zachowuje:

- wskazane konto owner/admin i trwałe konto CI;
- usługi, warianty, kategorie usług i przypisania ownera;
- konfigurację salonu, grafiki, ustawienia i integracje.

Usuwa dane operacyjne klientów, wizyty i ich zależności oraz magazyn, po czym
tworzy:

- 12 klientów `synthetic.client.XX@example.invalid`, bez telefonów i zgód;
- 30 wizyt obejmujących wszystkie statusy;
- 4 kategorie, 12 produktów i 2 dostawców z markerami `SYNTHETIC`/`SYNTH-`;
- dostawę, zamówienie, sprzedaż, zużycie i inwentaryzację;
- reprezentatywne prowizje, opinie, lojalność i recepturę usługi.

`cleanup` usuwa wyłącznie rekordy rozpoznane po markerach syntetycznych.

## Komendy

Uruchamiaj z `backend/salonbw-backend`. W lokalnym, ignorowanym przez Git
`.env` ustaw chronione konta. `[OWNER_EMAIL]` i `[CI_EMAIL]` są placeholderami;
nie zapisuj prawdziwych adresów w repo ani argumentach polecenia.

```bash
SYNTHETIC_PROTECTED_EMAILS=[OWNER_EMAIL],[CI_EMAIL]
```

```bash
pnpm synthetic:data:plan
pnpm synthetic:data:verify
```

Operacje zapisujące mają cztery niezależne bramki:

1. `SYNTHETIC_DATA_ALLOWED=true`;
2. `APP_LIFECYCLE=prelive`;
3. `--confirm RESET_PRELIVE_DATA`;
4. regularny, niepusty `pg_dump`, nie starszy niż 30 minut.

```bash
export SYNTHETIC_DATA_ALLOWED=true
export APP_LIFECYCLE=prelive

pg_dump "$DATABASE_URL" \
  --format=custom \
  --file=/secure/path/salonbw-prelive.dump

pnpm synthetic:data:apply -- \
  --backup-file /secure/path/salonbw-prelive.dump \
  --confirm RESET_PRELIVE_DATA

pnpm synthetic:data:verify
```

Analogicznie `pnpm synthetic:data:cleanup -- ...` usuwa tylko dataset
syntetyczny, ale wymaga tych samych bramek i backupu.

## Kontrole i rollback

- `plan` i `verify` nie rozpoczynają transakcji i niczego nie zapisują.
- `apply` wykonuje reset, seed i weryfikację w jednej transakcji.
- Rozbieżna liczność, brak chronionego konta albo nieoczekiwany klucz obcy
  powoduje rollback.
- Raport CLI nie zawiera adresów chronionych kont ani danych logowania.
- Narzędzie nie wysyła wiadomości; syntetyczne konta mają wyłączone zgody i
  używają zarezerwowanej domeny `.invalid`.

Po błędzie nie ponawiaj `apply` automatycznie. Zachowaj raport, sprawdź schemat
i wykonaj ponownie `plan`. Restore z dumpa jest procedurą awaryjną i wymaga
osobnej decyzji operatorskiej.

## Status

Kod i testy narzędzia są gotowe. Pierwsze `apply` 2026-07-29 zostało
zatrzymane przez kontrolę schematu przed rozpoczęciem transakcji; baza pozostała
bez zmian. Reset bazy oraz import z Versum nie zostały wykonane.
