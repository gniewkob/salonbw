# SalonBW — uproszczona rejestracja i komunikacja (DEV, 2026-11-08)

Status: **draft do UAT i zatwierdzenia prawnego**. Nie wdrażać na produkcję ani nie scalać do master bez pełnego CI, testu procesu rejestracji i akceptacji brzmienia oświadczenia.

## Decyzja produktowa

1. Standardowa rejestracja i obsługa rezerwacji nie wymaga obowiązkowego checkboxa „zgoda RODO”. Zamiast tego prezentujemy informację o przetwarzaniu i odsyłacz do Polityki prywatności.
2. Akceptacja regulaminu pozostaje obowiązkowa jako warunek zaakceptowania zasad rezerwacji; nie nazywamy jej zgodą RODO.
3. Marketing bezpośredni ma **jeden dobrowolny checkbox** wymieniający e-mail, SMS i WhatsApp. Domyślnie niezaznaczony. Klient może nie wyrazić zgody i nadal zarejestrować konto.
4. Backend rejestruje ten sam wersjonowany tekst oświadczenia jako dowód na każdym z trzech niezależnych zakresów DIRECT_MARKETING × channel. Inne cele (NEWSLETTER i REVIEW_REQUEST) pozostają odrębne, nie są automatycznie udzielane.
5. Domyślne powiadomienia operacyjne: e-mail włączony; SMS i WhatsApp wyłączone (obecny stan kodu). Marketingowe preferencje domyślnie włączone, ale **nie uprawniają do wysyłki bez ważnej zgody dla celu i kanału**. Użytkownik może je indywidualnie ograniczyć.
6. Odwołanie zgody marketingowej blokuje marketing w odpowiednim zakresie, nie anuluje informacji o istniejących rezerwacjach. Całościowe wycofanie jednym działaniem i ponowne grupowe udzielenie zgodnie z aktualnymi preferencjami to osobny zakres API/UX; nie udawać, że ten krok został już wdrożony.

## Kontrakt wdrożonego zakresu

- UI: `apps/panel/src/pages/auth/register.tsx` i helper `utils/registrationMarketing.ts`: brak checkboxa GDPR, polityka prywatności widoczna, obowiązkowy regulamin, jeden marketingowy opt-in, domyślnie false.
- API: `RegisterDto.gdprConsent` pozostaje opcjonalnym polem kompatybilności wstecznej; brak wymogu true. `marketingConsent` jest opcjonalne i ma pierwszeństwo nad starszymi trzema flagami.
- Audit: `REGISTRATION_DIRECT_MARKETING_TEXT_VERSION` (bundle) w `CONSENT_TEXTS`, wersja zapisywana przy każdym przyznanym kanale bez migracji istniejących zdarzeń. Stare osobne checkboxy starszych klientów zachowują dotychczasową wersję.
- Fail closed: jeśli w chwili rejestracji wyrażono marketing, ale serwis dowodów zgody nie jest dostępny, rejestracja nie może potajemnie zapisać trzech booli jako zgody.
- Brak zmiany reguł wysyłania oraz brak automatycznej zgody dla już istniejących kont.

## Źródła i zakres poparcia

| Twierdzenie | Źródło | Przepis | Co faktycznie wynika |
| --- | --- | --- | --- |
| Dane niezbędne do wykonania rezerwacji nie wymagają odrębnej zgody jako podstawy | [RODO EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj) | art. 6 ust. 1 lit. b | Podstawa wykonania umowy lub działań przedumownych; tylko zakres niezbędny, nie dowolne przetwarzanie |
| Należy poinformować osobę o przetwarzaniu | [RODO EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj) | art. 13 | Obowiązki informacyjne; sam link do polityki musi prowadzić do kompletnej, adekwatnej treści |
| Zgoda wymaga możliwości wycofania | [RODO EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj) | art. 7 ust. 3 | Możliwość łatwego wycofania, bez negatywnych skutków dla koniecznych usług |
| Wysyłka informacji handlowej z użyciem wskazanych środków komunikacji wymaga wcześniejszej zgody | [PKE ISAP](https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20240001221) | art. 398 ust. 1 | Wymóg uprzedniej zgody; przepis nie narzuca konkretnie liczby checkboxów |
| Dane szczególne (np. notatki o zdrowiu) mają odrębne warunki | [RODO EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj) | art. 9 | Konieczna dodatkowa analiza; nie jest objęta zgodą na ogólną rezerwację |

**Decyzja projektowa wymagająca legal review:** jedno dobrowolne oświadczenie opisujące trzy wyraźnie nazwane kanały, z osobnymi wpisami dowodowymi per kanał. Nie przedstawiać go jako konstrukcji wprost „nakazanej przez RODO”. Przy audycie upewnić się, że tożsamość zgadzającego się, data, źródło i pełna wersja tekstu są odtwarzalne.

## Bramy jakości i rollout

- CI dokładnego SHA: frontend typecheck, lint, test rejestracji, backend typecheck/test DTO oraz UsersService.
- DEV UAT: rejestracja bez marketingu; rejestracja z marketingiem; odmowa regulaminu; brak GDPR checkboxa; 3 wpisy audytu z **tą samą wersją tekstu** tylko po opt-in; brak uprawnienia dla newslettera/review; odwołanie zgód; brak regresji istniejących rezerwacji.
- Wdrażać na DEV w kolejności API → Panel, ponieważ stara wersja API wymaga gdprConsent=true.
- Produkcja: wyłącznie po osobnym zatwierdzeniu i akceptacji prawnej.
- Do kolejnej iteracji: atomowe „Wycofaj cały marketing” w profilu klienta; uproszczona prezentacja uprawnień w V18 bez usunięcia zaawansowanych preferencji i audytu; kanały muszą być nadpisywalne indywidualnie.
