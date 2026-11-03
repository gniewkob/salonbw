# UAT follow-up: spójność godzin, dane E2E i konto administratora

- **Data:** 2026-10-25
- **Agent:** Codex
- **Commit(y):** zmiany lokalne; rollout kodu jeszcze nie wykonany
- **PR:** brak

## Finding

Kontynuacja [audytu UAT](2026-10-25-uat-repository-audit.md).

### Logowanie i autoryzacja działań

- Owner potwierdził, że zmienił hasło dotychczasowego admina i początkowo
  zalogował się nim do panelu. Odczytowe porównanie bcrypt wykazało, że
  historyczne hasło zapisane w Keychain nie odpowiada obecnemu hasłu konta.
  Nie odczytywano ani nie ujawniano hashy/sekretów w wynikach.
- Owner jawnie zatwierdził aktualizację `E2E_ADMIN_EMAIL` i
  `E2E_ADMIN_PASSWORD` w GitHub oraz ponowienie regresji. Aktualne hasło
  wprowadził w ukrytym oknie systemowym. Przed aktualizacją sekretów
  porównano je odczytowo z hashem istniejącego admina. Hasła aplikacji
  i zawartości Keychain nie zmieniono.
- Run `40187173666` nie przeszedł setupu admina. Nadal aktywna była CAPTCHA:
  3 błędne próby e-mail w ostatnich 30 min, choć 0 w ostatnich 15 min.
  To różne mechanizmy (`isCaptchaRequired` vs `isAccountLocked`).
  Nie kasowano historii prób ani blokad; oczekiwano na naturalne wygaśnięcie.
- Następnie owner zgłosił trudność logowania i wskazał inne konto jako
  administratora. Konto nie istniało; po zgłoszeniu tego faktu owner jawnie
  wybrał **utworzenie nowego admina** z hasłem wpisanym w ukrytym oknie.
  To odrębna zgoda od wcześniejszej synchronizacji E2E.

Adresy kont ownera są celowo pominięte w wersjonowanej dokumentacji.

### Godziny — błędy odtworzone testami przed zmianą

1. Zamknięty cały tydzień powodował powrót do godzin zapasowych.
2. CTA katalogu obiecywało jednolite „09–19 w tygodniu”.
3. Serwerowe JSON-LD ignorowało aktualny grafik i miało stałe godziny.
4. Widoki dopisywały niedzielę zamkniętą niezależnie od grafiku, powodując
   sprzeczność, gdy harmonogram otwierał niedzielę.
5. Najbliższy termin był formatowany w strefie urządzenia zamiast salonu;
   test uruchomiony w `TZ=UTC` odtworzył błąd przed poprawką.

## Change

- `utils/openingHours.ts`: wspólny model tygodnia, sprawdzenie kompletności
  danych i generator schema.org z tych samych przedziałów co widok.
- `useOpeningHours`: przyjmuje grafik z serwera, odświeża go po stronie
  klienta i zachowuje jawne zamknięcie całego tygodnia. Wszystkie dni,
  w tym niedziela, pochodzą z API; brak osobnej stałej niedzieli.
- Home: godziny w propsach generowanych na serwerze; ISR ustawione na 60 s.
  To rewalidacja na żądanie po upływie interwału, nie gwarancja odświeżenia
  co minutę bez ruchu. Przeglądarka dodatkowo pobiera aktualny grafik.
- Kontakt: SSR pobiera aktualne godziny dla każdego żądania. Odczyt ma
  timeout 4 s; przy awarii API pomijane są godziny SEO, zamiast publikowania
  stałych danych. Widok zachowuje dotychczasowy fallback konfiguracji przy
  braku odpowiedzi API; nie jest to dowód aktualności godzin podczas awarii.
- CTA PL/EN/DE odsyła do dostępnych terminów w kalendarzu zamiast ogólnej
  obietnicy godzin otwarcia. Bez zmiany układu/kolorów marki.
- Najbliższy termin ma jawną strefę `Europe/Warsaw`.
- Za zgodą ownera wykonano synchronizację dwóch sekretów E2E i utworzenie
  nowego admina w produkcji. Utworzenie konta wykonano w jednej transakcji,
  z kontrolą braku istniejącego konta, bcrypt cost 12 oraz potwierdzeniem
  roli i zgodności hasła po zapisie. Domyślna techniczna nazwa:
  `Administrator`. Nie ustawiano zgód marketingowych ani nie wysyłano
  wiadomości przy utworzeniu konta. Nowego osobistego konta nie przypisano CI.
- Stary admin pozostał bez zmian. Nowe hasło nie trafiło do GitHub, Keychain,
  plików, komend procesów ani logów. Dane wprowadzono lokalnie, przekazano
  przez szyfrowane SSH stdin i zapisano wyłącznie jako hash w bazie.
- `pnpm install --frozen-lockfile --ignore-scripts` wyrównało lokalne
  zależności do wersjonowanego lockfile, bez zmiany manifestów/lockfile.
  Lokalny Next przed wyrównaniem: 15.5.24, po wyrównaniu: 15.5.28.

## Validation

- Fail-first: testy zamkniętego tygodnia/CTA, serwerowego grafiku/JSON-LD,
  otwartej niedzieli oraz strefy najbliższego terminu najpierw FAIL,
  po poprawkach PASS. Nie stosowano stash/reset zastanych zmian.
- Pierwszy pełny zestaw po poprawce grafiku: 82/82. Końcowy wynik po
  dodatkowych przypadkach i wyrównaniu zależności: **87/87** (25 zestawów).
  Ponownie na przypiętym lockfile: panel **408/408**, backend **454/454**.
- Landing: ESLint src z autofix PASS, typecheck PASS, build PASS na Next
  15.5.28. Osobny test najbliższego terminu w `TZ=UTC`: PASS.
- Surowy HTML home i kontaktu: propsy godzin zgodne z live API, po 5
  specyfikacji godzin schema.org; kontrola bez polegania na hydratacji.
- Lokalny kontakt mobile 390 i katalog desktop 1440: brak poziomego
  overflow; proxy `/api/calendar/opening-hours` zwraca 200. Lighthouse
  accessibility home/kontakt/katalog: **100/100/100**, brak niezaliczonych
  audytów tej kategorii. Screenshot kontaktu 390 i katalogu 1440 sprawdzony.
- Regresja produkcyjna po spadku liczby błędnych prób poniżej progu CAPTCHA:
  run `40187848395` — **completed/success, 23/23** (46,3 s testów).
  Nie pobierano trace'ów klientek.
- Utworzenie admina: rola `admin` i bcrypt compare PASS po COMMIT.
  Nie jest to jeszcze potwierdzenie ręcznego przejścia nowego konta przez UI.
- Lokalny podgląd mobile 390: home ma zgodne godziny i schema.org bez
  poziomego overflow. Początkowy build z bezpośrednim API miał lokalne
  błędy CORS dla localhost; końcowy podgląd używa same-origin `/api`.

## Rollout

- **Wykonane operacje produkcyjne:** zatwierdzona synchronizacja sekretów
  E2E w GitHub i zatwierdzone utworzenie jednego konta admina. Bez resetu
  haseł istniejących kont, zmian CORS, restartów lub modyfikacji wizyt.
- **Kod landingu:** lokalny, bez push/deploy. Weryfikacja lokalna nie jest
  dowodem wdrożenia poprawki. Wcześniejsze lokalne commity i zmiany planu
  ownera zachowane.
- Rollback nowego konta wymaga decyzji ownera; najpierw sprawdzić zależności
  i sesje. Nie usuwać go automatycznie po próbie logowania. Skrypt rotacji
  `rotate-prelive-admin-password.sh` zakłada dokładnie jednego admina;
  przy dwóch ma zatrzymać się, nie wybierać konta losowo.

## Follow-up

1. Regresja po naturalnym wygaśnięciu CAPTCHA zakończona sukcesem;
   nie powtarzać nieudanych prób ze starym hasłem.
2. Owner potwierdza logowanie nowym kontem admina.
3. Przegląd i wdrożenie poprawki landingu: CI konkretnego SHA, deploy na dev,
   screenshot/smoke godzin i JSON-LD po wdrożeniu.
4. Cutover nadal wymaga odrębnej akceptacji: runtime CORS, izolacja dev,
   backup/rollback PHP, UAT i canonical/legal/Meta. Plan domen bez zmian celu.
