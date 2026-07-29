# Syntetyczne dane przed live

## Decyzja

Do czasu jawnego otwarcia systemu nie importujemy zrzutu klientów ani magazynu
z Versum. Zrzut pozostaje offline. Panel używa deterministycznego, pozbawionego
danych osobowych zestawu syntetycznego.

Narzędzie nie jest migracją TypeORM i nie uruchamia się podczas deployu.
Każde użycie jest osobną, audytowalną operacją operatorską.

## Źródło prawdy dla wizyt

Jedynym źródłem prawdy są regularne godziny, przerwy i wyjątki aktywnego
grafiku Oli. Generator nie używa godzin oddziału ani zakodowanych dni tygodnia
jako fallbacku. Wyjątek `custom_hours` zastępuje cały dany dzień i nie
dziedziczy tygodniowych przerw.

`scheduleSummary.convertedInProgress` oznacza liczbę planowanych wizyt
`in_progress`, których nie można było umieścić w aktywnym zakresie pracy dnia
kotwicy. Generator przenosi je do przyszłego dozwolonego zakresu i zmienia ich
status na `confirmed`.

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

Obie komendy są tylko do odczytu: nie rozpoczynają transakcji i nie zmieniają
danych. Publiczny raport pokazuje agregaty `plan.scheduleSummary` oraz
`verification.scheduleViolations`; nie zawiera surowych godzin, rekordów
grafiku ani danych osobowych. `verify` może zakończyć się błędem, jeżeli
istniejący dataset narusza grafik — to blokada bezpieczeństwa, nie sygnał do
automatycznego `apply`.

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

Workflow `Deploy (MyDevil)` nigdy nie uruchamia `synthetic:data:apply`.
Po wdrożeniu kodu operator najpierw wykonuje wyłącznie odczytowy `plan` i
przedstawia raport ownerowi. Pojedynczy zapis produkcyjny ma obowiązkową,
nierozłączną kolejność:

1. świeża, jawna zgoda ownera na ten przebieg;
2. świeży `pg_dump` oraz potwierdzenie, że jest niepustym plikiem regularnym
   młodszym niż 30 minut;
3. dokładnie jedno `synthetic:data:apply`;
4. `synthetic:data:verify` z wymaganiem `scheduleViolations = 0`;
5. kontrola `/healthz`;
6. kontrola zamkniętego dnia i reprezentatywnego dnia pracy w kalendarzu;
7. ponowna rotacja tymczasowego hasła bazy.

## Kontrole i rollback

- `plan` i `verify` nie rozpoczynają transakcji i niczego nie zapisują.
- `apply` wykonuje reset, seed i weryfikację w jednej transakcji.
- Rozbieżna liczność, brak chronionego konta albo nieoczekiwany klucz obcy
  powoduje rollback.
- Raport CLI nie zawiera adresów chronionych kont ani danych logowania.
- Narzędzie nie wysyła wiadomości; syntetyczne konta mają wyłączone zgody i
  używają zarezerwowanej domeny `.invalid`.

Po błędzie nie ponawiaj `apply` automatycznie. Zachowaj raport, sprawdź schemat
i wykonaj ponownie `plan`. Każdy kolejny `apply` wymaga nowej zgody ownera i
nowego dumpa. Restore z dumpa jest procedurą awaryjną i wymaga osobnej decyzji
operatorskiej.

## Status

E4.2 zakończono 2026-07-29. Po świeżym dumpie i zatwierdzeniu wykonano
transakcyjny reset oraz seed. Niezależne `verify` potwierdziło 12 klientów,
30 wizyt, 12 produktów, 5 dokumentów magazynowych, oba chronione konta,
0 pozostałych niesyntetycznych klientów i 0 blockerów. Zrzut Versum nadal
pozostaje offline i nie został zaimportowany.
