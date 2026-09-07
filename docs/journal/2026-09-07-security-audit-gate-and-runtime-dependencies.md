# Bramka audytu CI i aktualizacja zależności runtime

- **Data:** 2026-09-07
- **Agent:** Codex
- **Commit(y):** commit zawierający ten wpis; punkt wyjścia `0aa0aeaf`
- **PR:** brak; master, wdrożenie zatwierdzone przez ownera
- **Autoryzacja:** odpowiedź ownera „tak potwierdzam” na zakres bramki CI,
  siedmiu bibliotek, testów i wdrożenia.

## Finding

`pnpm audit --json` na wejściowym lockfile: 14 high i 8 moderate.
`--ignore-unfixable` w pnpm 10.14.0 uruchamia zapis wyjątków i zwraca sukces;
nie egzekwuje progu high. Potwierdzono wcześniej zachowaniem lokalnym, CI
i źródłem przypiętej wersji pnpm. Po usunięciu flagi, przed aktualizacją
zależności, rzeczywista bramka zakończyła się kodem 1.

MyDevil instaluje zależności runtime przez npm, które nie stosuje overrides
z `pnpm-workspace.yaml`. Odczyt `npm22 ls --omit=dev --all --json` przed zmianą
potwierdził m.in. API: socket.io-parser 4.2.5 i ip-address 10.1.0;
panel: fast-uri 3.1.5; landing: fast-uri 3.1.4, brace-expansion 5.0.8,
nanoid 3.3.16. Zielony audyt lockfile nie dowodzi wersji uruchomionej aplikacji.

## Change

- CI: `pnpm audit --audit-level=high`, bez flagi zapisującej wyjątki.
- Przypięto zweryfikowane wersje siedmiu bibliotek: socket.io-parser 4.2.7,
  fast-uri 3.1.6, ip-address 10.3.1, brace-expansion 5.0.9,
  js-yaml 3.15.1 / 4.3.1, nanoid 3.3.18, browserslist 4.28.7.
- Lockfile aktualizuje także dane przeglądarek wymagane przez browserslist.
- W manifestach API, panelu i landingu dodano zakresowe overrides npm dla
  dotkniętych zależności runtime. Istniejący js-yaml 5.2.1 na API i starsze,
  nieobjęte tym fixem główne wersje brace-expansion nie są wymuszane w dół.
- Uzupełniono instrukcje audytu i wdrażania. Istniejących wyjątków CVE nie
  poszerzano. Bez zmian logiki biznesowej, danych klientów i konfiguracji sekretów.

## Validation

- Fail-first: poprawiona komenda audytu na starym lockfile zwraca 1;
  po aktualizacji zwraca 0, raportuje 0 high/critical i 6 moderate.
- Panel: 95 zestawów / 378 testów PASS; landing: 20 / 56 PASS;
  backend: 44 / 352 PASS. Łącznie 786 testów.
- Root typecheck i pełny backend `tsc --noEmit`: PASS.
- Panel i landing ESLint: PASS; backend lint: 0 błędów, 153 ostrzeżenia.
  Automatyczne zmiany istniejącego formatowania backendu wycofano po kontroli
  identycznego wyjścia transpilacji, aby zachować zakres zależności.
- Build backendu, panelu i landingu: PASS. Pierwszy lokalny build landingu
  nie pobrał CMS przez niedostępny adres API (ECONNREFUSED); ponowienie z
  `NEXT_PUBLIC_API_URL=https://api.salon-bw.pl` przeszło. CI ustawia publiczny API.
- `pnpm install --frozen-lockfile --ignore-scripts`: PASS.
- Sześć moderate pozostało w dompurify, @humanfs/node i qs; nie blokują przyjętego
  progu CI i wymagają osobnego przeglądu, nie są uznane za usunięte.

## Rollout

W toku. Przed zamknięciem: handoff-check, commit/push, CI i Deploy success,
odczyt wersji z instalacji npm wszystkich trzech aplikacji oraz health/smoke.
Rollback: revert tego changesetu i ponowne wdrożenie; przywróci również
podatne wersje i wadliwą bramkę, więc preferować minimalny forward fix.

## Follow-up

Po potwierdzeniu rollout: test dwóch równoczesnych rezerwacji na izolowanej
bazie, test awarii powiadomień i rozliczenia. Poprawki zależności nie są
dowodem niezawodności całego procesu klientka–właścicielka.
