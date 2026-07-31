# E4.4 — health-checki i „stan na start" (Faza D)

- **Data:** 2026-07-31
- **Agent:** Claude (kontynuacja „przejdź sam i skoryguj" / „kontynuuj zgodnie z planem")
- **Commit:** brak zmian kodu — wpis dokumentacyjny + weryfikacja stanu

## Finding

Faza B (UAT) `docs/UAT_PLAN.md` jest w praktyce ukończona (patrz cztery
journale z 2026-07-30/31 + finding #4). Zgodnie z `docs/PROJECT_COMPLETION_PLAN.md`
§3.0/§5, kolejny krok na ścieżce do produkcji to **E4.4 (Faza D): health-checki
+ wpis „stan na start"**. Wykonane jako czysto weryfikacyjny krok, bez zmian
w kodzie.

## Health-checki (2026-07-31, ~17:03 UTC)

| Sprawdzenie | Wynik |
|---|---|
| `GET https://api.salon-bw.pl/healthz` | `200 OK` — `database: ok` (11,9 ms), `smtp: ok` (37,0 ms), `instagram: ok` (337,0 ms) |
| `HEAD https://panel.salon-bw.pl/` | `307` (przekierowanie na login — oczekiwane, panel działa) |
| `HEAD https://dev.salon-bw.pl/` | `200 OK` |
| CI/CD | Ostatni push-deploy (`9ffad414`, run `30642171935`) — `success` |

## Stan na start (skrót sesji 2026-07-30/31)

- **UAT §1 (właścicielka) i §2 (klientka) z `docs/UAT_PLAN.md` przejrzane
  w całości** — pulpit, kalendarz, umówienie/potwierdzenie/reschedule,
  finalizacja z pełnym §2a (dodatkowa usługa, sprzedaż produktu, zużyty
  materiał, rabat, napiwek, receptura, zalecenia), karta klientki, magazyn
  (niskie stany), statystyki/raport finansowy, ustawienia; ścieżka klientki:
  rejestracja, rezerwacja (mobile 390×844), wiadomości dwukierunkowe,
  akceptacja zmienionego terminu, ocena wizyty, edycja zgód.
- **8 realnych bugów znalezionych i naprawionych**, wszystkie wdrożone i
  zweryfikowane na żywo (pełne zapisy w journalach z 2026-07-30/31):
  1. CSP blokował Sentry frontendu na każdej stronie.
  2. Statystyki klienta dublowały sprzedaż produktu (dwie tabele sumowane
     zamiast wzajemnie wykluczających się).
  3. „Płatność: opłacona" zawsze pokazywała „nieopłacona" (dwuwarstwowy bug).
  4. Karta klientki → Historia nie pokazywała receptury/formuły koloru
     (dwuwarstwowy bug: brak odczytu + brak jawnego JOIN-a eager-relacji).
  5. Finalizacja KAŻDEJ wizyty dla usługi z recepturą zawsze kończyła się 400.
  6. Baner niskiego stanu magazynowego na pulpicie zaniżał liczbę produktów
     wymagających uwagi (mógł zniknąć całkowicie w skrajnym przypadku).
  7. Raport finansowy mylił pełną kwotę transakcji (`paidAmount`) z czystym
     przychodem usługowym — finding #4, ostatni znany dług finansowy.
  8. Incydent produkcyjny (deploy padał z powodu rozjechanych sekretów
     `DATABASE_URL`/`PGPASSWORD`) — zdiagnozowany i naprawiony bez rotacji.
- **Zero otwartych 🔴** w zakresie UAT §1+§2. Pozostałe drobne 🟡/🎨
  (przekierowanie wygasłej sesji, surowe komunikaty walidacji, nazwa
  eksportu Excel/CSV, brak rozbicia per-pracownik dla admina-jako-jedynej-
  wykonawczyni) spisane do backlogu ETAP 5 w poszczególnych journalach.

## Change

Brak zmian w kodzie. Aktualizacja `docs/PROJECT_COMPLETION_PLAN.md` §5
(checklista GO) — Faza B odhaczona, E4.4 odhaczone.

## Validation

Health-checki wykonane bezpośrednio na produkcji (nie z cache/mocka) —
patrz tabela wyżej.

## Rollout

Bez wdrożenia (wpis dokumentacyjny).

## Follow-up — co dalej blokuje GO, i kto to odblokowuje

Zgodnie z `docs/PROJECT_COMPLETION_PLAN.md` §5, pozostałe otwarte pozycje są
**poza zakresem agenta** (wymagają działania właściciela):

1. **Faza C — E2.1 restore-drill backupu bazy**: mail do
   `pomoc@mydevil.net` z prośbą o potwierdzenie, że dump bazy faktycznie
   dochodzi i się odtwarza. Nietestowany backup ≠ backup. **Tylko owner
   może wysłać ten mail i potwierdzić odpowiedź.**
2. **Faza D — E4.6 miękki start**: decyzja o faktycznym udostępnieniu panelu
   klientkom (Booksy jako backup, monitoring pierwszych realnych rezerwacji)
   — decyzja biznesowa, nie techniczna.
3. **Faza D — E3 import z Versum**: świadomie odłożony do osobnego okna po
   decyzji GO; wymaga wsadu danych i jawnej zgody ownera na każdym kroku
   (reguła §4 planu — poza zakresem agentów).
4. **Faza E (nie blokuje panelu, równolegle)**: E2.3 decyzja o domenie
   landingu, E0.2 przegląd prawny przez radcę, E2.4 SMS jako drugi kanał
   alertu, E2.7 `UPLOADS_DIR` weryfikacja, E2.8 test WhatsApp na realnym
   numerze, E2.9 NIP/REGON w danych salonu.

**Krótko: ścieżka techniczna do produkcji (Fazy A + B) jest ukończona.**
Wszystko co zostało, wymaga decyzji lub działania właściciela — kod i
weryfikacja nie są już wąskim gardłem.
