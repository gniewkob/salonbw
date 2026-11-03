# Audyt UAT, danych publicznych i przygotowania deployu

- **Data:** 2026-10-25
- **Agent:** Codex
- **Commit(y):** przygotowanie lokalne; bez push/deploy zmian tego zadania
- **PR:** brak
- **Zakres:** stan lokalnego repo, publiczny runtime, odczytowe agregaty bazy,
  CI, testy i plan środowisk. To nie jest akceptacja biznesowa całego systemu.

## Finding

### Decyzja

**UAT może być kontynuowane; przełączenie domeny pozostaje NO-GO.**
Publiczny grafik i cennik działają na `dev.`, ale świeżą regresję blokuje
logowanie admina technicznego. Pozostają też rozbieżności treści, brak CORS
domeny głównej i niegotowy podział środowisk wdrożeniowych.

### Stan repo i wydania

- Lokalnie `master` na `7ef5a6c6`, dwa commity przed `origin/master`.
  Zastana niezacommitowana zmiana `docs/DOMAIN_CUTOVER_PLAN.md` została zachowana.
- `origin/master`: `ffb931f2a9958df5c91601947a1b6d84bd4b70bd`.
  CI `40130153868` i Deploy `40130153901`: success. Nie oznacza to, że każdy
  komponent runtime został przebudowany w tym runie: deploy jest selektywny.
- Przygotowana wcześniej Faza 0 domeny jest lokalna; nie utożsamiać jej
  testów z wdrożeniem na serwerze.

### Godziny i katalog — weryfikacja live 2026-10-25

| Element | Wynik i granica dowodu |
|---|---|
| Grafik Aleksandry | Jedyny aktywny grafik pracownika z usługami rezerwowalnymi online należy do Aleksandry; potwierdzone zapytaniem READ ONLY, bez pobierania danych klientek |
| Poniedziałek / piątek | 09:00–16:00 |
| Wtorek / czwartek | 12:00–19:00 |
| Środa / niedziela | zamknięte |
| Sobota | 09:00–13:00 |
| `/calendar/opening-hours` | 200, `source=timetables`; proxy landingu zwraca ten sam grafik |
| Kontakt i strona główna | wyrenderowane godziny zgodne z API; sprawdzone w przeglądarce |
| `/services/public` → SSR `/services` | 60 usług, 4 kategorie; zestawy ID/cena/czas identyczne; 0 ujemnych cen i 0 niepoprawnych czasów |
| Prezentacja katalogu | 60 wariantów grupowanych w 27 konceptów; ceny „od” i zakres czasu wynikają z minimum/maksimum wariantów, a nie z brakujących usług |
| Aktualizacja usług | `getServerSideProps` pobiera katalog przy żądaniu strony; nie trzeba przebudowywać aplikacji dla każdej ceny |
| Strony opisu usług | treści marketingowe, odsyłające do katalogu; nie są osobnym źródłem cen |

Ważne ograniczenia obecnej implementacji:

1. **P1, przed cutoverem: CORS domeny głównej.** Żądanie GET z
   `Origin: https://salon-bw.pl` kończy się HTTP 500; `dev.` i `panel.` dostają
   200 oraz poprawny `Access-Control-Allow-Origin`. Runtime `FRONTEND_URL`
   dopuszcza tylko `dev.` i `panel.`. Zmienne GitHub environment mają inną
   listę niż runtime; workflow generuje tę wartość z **sekretu**, nie z
   `vars.FRONTEND_URL`. Użycie samego `gh variable set` nie naprawi CORS.
2. **P2, treść godzin:** CTA w `apps/landing/src/pages/services.tsx` korzysta
   z `BUSINESS_INFO.hours.mondayFriday`, wyświetlając „09:00–19:00 w tygodniu”.
   Pomija to środę wolną i różne godziny pozostałych dni. Usunąć ogólną
   obietnicę lub wyświetlać ten sam grafik co kontakt.
3. **P2, SEO i aktualizacja grafiku:** `openingHoursSpecification` w
   `pages/index.tsx` i `pages/contact.tsx` ma godziny wpisane na stałe.
   Dziś pasują, ale zmiana grafiku w panelu ich nie aktualizuje. Hook
   `useOpeningHours` aktualizuje widok po stronie klienta; początkowy HTML
   korzysta ze statycznego fallbacku. Przed publikacją ujednolicić źródło
   dla widoku i serwerowego JSON-LD.
4. **P2, zamknięcie całego tygodnia:** hook przy braku jakiegokolwiek dnia
   otwartego wraca do kompaktowych godzin z konfiguracji. To może ogłosić
   otwarcie przy celowo zamkniętym tygodniu; wymaga testu regresji i poprawki.
5. Endpoint godzin opisuje **grafik tygodniowy**, nie urlopy ani wyjątkowe dni.
   Dostępność rezerwacji trzeba odbierać osobno. `NearestSlotTeaser` formatuje
   godzinę w strefie urządzenia, bez jawnego `Europe/Warsaw`; sprawdzić
   zachowanie dla klientki z inną strefą przed publikacją.

### Import i spójność — tylko odczyt

Zapytania przez SSH wykonano w `BEGIN READ ONLY`, z timeoutem 10 s i
`ROLLBACK`; do raportu trafiają wyłącznie agregaty, bez danych klientek.

- Powiązania Booksy: 1047 klientek, 10 109 wizyt, 144 opinii.
- Wszystkie wizyty w bazie: 10 179; 0 przedziałów `endTime <= startTime`;
  0 brakujących relacji klient/pracownik/usługa.
- 5 importowanych wizyt ma przyszłą datę, **wszystkie anulowane**.
  To nie są aktywne przyszłe rezerwacje. Importer pomija status `Confirmed`
  bez `IMPORT_BOOKSY_INCLUDE_FUTURE`, a nie wszystkie daty przyszłe.
- Nie porównywano ponownie każdego rekordu z eksportem źródłowym; same
  liczności i integralność relacji nie dowodzą pełnej zgodności z Booksy.
- Magazyn pozostaje oznaczony jako syntetyczny według planu UAT; nie
  uznawać tego audytu za uzgodnienie stanów ani dokumentów finansowych.

### Funkcjonalności i testy

| Kontrola | Wynik |
|---|---|
| Health API | 200; database, SMTP i Instagram: `ok`; nie jest to dowód odbioru wiadomości na urządzeniu |
| 11 publicznych tras dev | 200, `X-Robots-Tag: noindex, nofollow`; w tym 3 trasy prawne i sitemap |
| Domena główna `/privacy` | 404 na obecnej starej stronie; oczekiwane przed cutoverem, blokuje podmianę URL-i Meta wcześniej |
| Panel bez sesji | przekierowanie na `/auth/login`, formularz dostępny |
| Przegląd landingu | home/contact/services/gallery, desktop 1440 i wybrane widoki mobile 390; brak zaobserwowanego poziomego overflow |
| Rezerwacja publiczna | modal otwiera się i zamyka; link rejestracji wskazuje panel; bez tworzenia wizyty |
| Galeria Instagram | obrazy załadowane, 0 uszkodzonych w sprawdzonym widoku; nie testowano uploadu zdjęć klientki |
| Landing Jest | 23 zestawy, 78 testów PASS |
| Panel Jest | 98 zestawów, 408 testów PASS |
| Backend Jest | 55 zestawów, 454 testy PASS |
| Kalendarz w `TZ=Europe/Warsaw` | 16 testów PASS; historycznego błędu DST nie odtworzono, nie uznano go za naprawiony |
| Typecheck | landing, panel, backend PASS |
| ESLint bez zapisu | landing i panel PASS; backend: 68 błędów formatowania, 151 ostrzeżeń; brak autofix w audycie |
| Build landingu | PASS z jawnymi trzema adresami API ustawionymi na `https://api.salon-bw.pl`; lokalne ustawienia domyślne wcześniej dały `ECONNREFUSED` przy SSG strony głównej |
| `pnpm audit --audit-level=high` | exit 0; 12 moderate, 1 high ignorowane zgodnie z istniejącym wyjątkiem; brak nowego wyjątku |
| Skrypty frontend deploy | istniejące testy ekstrakcji/change detection PASS |
| Nowy wrapper deployu | 9 scenariuszy z atrapami gh/curl PASS; żadnego rzeczywistego dispatchu deployu |
| Regresja panelu po zalogowaniu | run `40185627675` FAILURE: 1 failed, 21 did not run, 1 passed (logowanie klientki); setup logowania admina nie opuszcza `/auth/login` |

**Bramka P1 — admin E2E:** odczyt agregatów `login_attempt` w czasie regresji
potwierdził 3 nieudane logowania roli admin i 1 udane logowanie klientki.
Nie jest to błąd startu przeglądarki. Nie ustalono, czy winne są nieaktualne
dane konta w CI czy stan konta; nie sprawdzano wartości haseł ani nie
resetowano konta/blokad. Sekrety E2E mają metadane aktualizacji 2026-10-23.
Przed dalszymi próbami operator powinien zweryfikować konto techniczne i
spójność konfiguracji logowania bez udostępniania sekretów w czacie.
Nie raportować obecnie „regresja 23/23”; to wynik wcześniejszego runu.

Testy jednostkowe uruchomiono przez `pnpm --filter <pakiet> exec jest
--runInBand`. Początkowe wywołanie `test -- --runInBand` zostało błędnie
zinterpretowane jako wzorzec ścieżki; nie zaliczono go jako testu.
Lokalny Node: 26.12.0, pnpm: 10.14.0; CI jest na Node 22. To ograniczenie
lokalnego dowodu; CI dla nowego lokalnego zestawu zmian jeszcze nie istnieje.

### Hosting i rozdzielenie środowisk

- MyDevil: domena główna ma typ PHP; `dev.`, `panel.` i `api.`: Node.js.
- Metadane WWW/TLS odczytano pluginem MyDevil; zbiorcze inventory ma status
  `partial`, więc nie oznacza pełnego audytu limitów/backupów/hostingu.
- SSH potwierdziło realne cele symlinków:
  `apps/nodejs/salonbw`, `apps/nodejs/panelbw`, `apps/nodejs/api_salonbw`.
- Zmienne repo `MYDEVIL_PUBLIC_APP_NAME_{STAGING,PRODUCTION}` wskazują dziś
  na `dev.salon-bw.pl`; API staging wskazuje tę samą aplikację co produkcja,
  a resolver panelu ma wspólną ścieżkę wpisaną na stałe.
- **Nie wolno uznawać `environment=staging target=all` za izolowane testy.**
  Może wdrożyć API/panel na produkcję. Nowy wrapper odrzuca ten wybór.
  Bezpośredni dispatch starego workflow nadal wymaga ostrożności; nie
  dodano jeszcze blokady w samym resolverze.
- `COOKIE_DOMAIN=.salon-bw.pl` oznacza współdzielone cookies także z nowymi
  subdomenami dev. Osobna baza nie izoluje automatycznie sesji; projekt
  dev-panel/dev-api musi jawnie rozdzielić nazwy/zakres cookies, klucze i CORS.

## Change

- `scripts/deploy-environment.sh`: podgląd domyślny, development tylko dla
  landingu, produkcja `all` lub cel pojedynczy. Sprawdza mapowanie zmiennych
  z uwzględnieniem środowiska, rzeczywisty CORS oraz zielone CI danego SHA.
  Dopiero `--execute` dispatchuje istniejący workflow. Nie zmienia DNS,
  hostingu, sekretów, bazy ani dotychczasowego automatu push.
- `scripts/test-deploy-environment.sh`: scenariusze odmowy i poprawnego
  przekazania parametrów, wyłącznie atrapy usług zewnętrznych.
- Plan domen rozszerzony o wynik audytu oraz decyzję ownera: od razu
  zaplanować dev-panel/dev-api z osobną bazą i bez wysyłki do klientek.
- `PROJECT_STATE.md`: odświeżenie stanu i usunięcie mylącego utożsamienia
  dawnych runów i historycznych blokerów z aktualnym wynikiem audytu.

## Validation

`bash -n`, 9 scenariuszy wrappera oraz podglądy na aktualnych zmiennych
GitHub: development ma 0 blokad; produkcja wykrywa błędny host/ścieżkę i
odrzucony CORS. Nie użyto `--execute` poza atrapami.

## Rollout

Brak wdrożenia zmian tego zadania. Nie zmieniono DNS, WWW, `.env`, sekretów,
kluczy, haseł ani danych biznesowych. Uruchomiono istniejący workflow regresji
panelu (normalne logowanie kont technicznych, testy bez tworzenia wizyt).
Nie pobierano artefaktów z danymi klientek ani wartości sekretów.

## Follow-up

1. Wyjaśnić logowanie admina technicznego, przywrócić zieloną regresję,
   naprawić spójność godzin/SEO i fallback zamkniętego tygodnia z testami.
2. Zamknąć UAT właścicielki: rezerwacja → akceptacja → przełożenie →
   finalizacja/anulowanie, powiadomienia z potwierdzeniem odbioru, upload,
   granice DST i strefy czasu; dane testowe lub izolowana baza.
3. Wdrożyć izolację dev-panel/dev-api według planu; nie kopiować realnych
   danych do developmentu bez osobnej decyzji i anonimizacji.
4. Przed cutoverem: backup i rollback PHP, CORS w rzeczywistym źródle
   konfiguracji, rozdzielenie resolvera, immutable SHA z CI/deploy success,
   akceptacja okna i treści prawnych, potem URL-e Meta.
