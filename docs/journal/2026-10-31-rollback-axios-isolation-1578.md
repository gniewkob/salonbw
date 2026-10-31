# #1578: syntetyczny test transportu Axios

- **Data:** 2026-10-31; **agent:** Codex; **PR:** brak.

## Finding
Jedyna bezpośrednia ścieżka kodu API korzystająca z Axios/HttpService to WhatsApp. Istniejący test Nock sprawdza treść i ponawianie, bez scenariuszy przekierowań. Nie wskazano rzeczywistej regresji.

## Change
Doprecyzowano dowody i ograniczenia w runbooku. Bez zmian działania aplikacji lub polityki bezpieczeństwa.

## Validation
Tymczasowa instalacja npm bez skryptów, Axios 1.20.0 i follow-redirects 1.16.2, Node 26.12.1, dwa serwery wyłącznie na 127.0.0.1, syntetyczny token i JSON: 307 same-origin POST/body/auth, 302 same-origin POST→GET, 307 cross-port POST/body bez auth: 3/3 PASS, exit 0. Usunięto tymczasowy katalog. Nie wykonano porównania ze starą wersją, testu aplikacji, TLS, FreeBSD ani Node 22.

## Rollout / follow-up
Brak działań na produkcji i poza localhost podczas testu HTTP. Brak merge, deploymentu, migracji lub restartu. BLOCKED: zidentyfikować konkretną regresję oraz dowieść pozostałych bramek runbooka.
