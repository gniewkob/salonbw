# Sensitive Data Onboarding Checklist

_Last updated: 2026-04-03_

Ta checklista obowiązuje przed załadowaniem do SalonBW jakichkolwiek danych:
- finansowych,
- personalnych,
- CRM,
- komunikacyjnych,
- eksportów z Versum lub innych systemów źródłowych.

## 1. Typ danych

- [ ] Określono źródło danych
- [ ] Określono zakres danych
- [ ] Określono, czy dane są:
  - [ ] produkcyjne
  - [ ] pseudonimizowane
  - [ ] zanonimizowane
  - [ ] syntetyczne

## 2. Cel użycia

- [ ] Dane są potrzebne do konkretnego celu:
  - [ ] development
  - [ ] staging
  - [ ] parity z Versum
  - [ ] testy regresji
  - [ ] analiza finansowa
- [ ] Zakres danych został ograniczony do minimum potrzebnego dla tego celu

## 3. Miejsce docelowe

- [ ] Dane trafią do:
  - [ ] local
  - [ ] staging
  - [ ] production
- [ ] Jeśli target to `local` albo `staging`, dane nie są surowym produkcyjnym dumpem bez anonimizacji

## 4. Bezpieczeństwo transportu i składowania

- [ ] Transport danych jest szyfrowany
- [ ] Składowanie danych jest szyfrowane albo znajduje się w kontrolowanym środowisku
- [ ] Dane nie będą trzymane:
  - [ ] w repo git
  - [ ] w GitHub Actions artifacts
  - [ ] w publicznych bucketach
  - [ ] w współdzielonych katalogach bez kontroli dostępu

## 5. Anonimizacja / pseudonimizacja

Jeśli dane nie trafiają do produkcji:

- [ ] Imiona i nazwiska zostały zamienione
- [ ] Emaile zostały zamienione
- [ ] Telefony zostały zamienione
- [ ] Adresy zostały zamienione
- [ ] Notatki wolnotekstowe zostały usunięte lub przepisane
- [ ] Identyfikatory płatności i kody bonów zostały zamaskowane lub zremapowane
- [ ] Treści SMS/email zostały zredagowane lub zastąpione szablonami

## 6. Gotowość środowiska

- [ ] Środowisko docelowe przeszło aktualny security hardening
- [ ] Logi są redagowane
- [ ] Workflowy produkcyjne nie mają arbitralnego remote shell
- [ ] Backup/restore policy istnieje dla środowiska docelowego

## 7. Decyzja

- [ ] Owner danych zaakceptował zakres
- [ ] Owner środowiska zaakceptował onboarding
- [ ] Decyzja `GO` została zapisana

## 8. No-Go cases

Nie wolno ładować danych, jeśli:

- [ ] nie wiadomo, skąd pochodzą,
- [ ] nie wiadomo, kto jest ownerem,
- [ ] nie wiadomo, gdzie będą składowane,
- [ ] non-prod ma dostać surowe dane produkcyjne,
- [ ] nie ma redakcji logów,
- [ ] nie ma backup/restore readiness,
- [ ] nie ma jawnej decyzji `GO`.
