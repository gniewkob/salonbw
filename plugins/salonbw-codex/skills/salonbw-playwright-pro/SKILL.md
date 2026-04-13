---
name: salonbw-playwright-pro
description: Use for higher-discipline Playwright work in SalonBW: smoke generation, auth-flow coverage, flaky test diagnosis, locator cleanup, and route-focused browser automation.
---

# SalonBW Playwright Pro

This is a SalonBW-specific adaptation of the broader Playwright workflow patterns from `claude-skills-main`, trimmed to the needs of this repo.

## Use this when

- adding or repairing Playwright smoke coverage
- debugging flaky panel or landing checks
- verifying login/dashboard/calendar flows
- reviewing brittle locators or bad waits

## Core rules

1. Prefer `getByRole()` over CSS/XPath.
2. Never use `waitForTimeout()` when a web-first assertion can replace it.
3. Cover one behavior per test.
4. Use real route semantics from SalonBW, not guessed routes.
5. Do not hardcode environments when `baseURL` or target config can express the same thing.

## SalonBW priority coverage

- landing homepage availability
- panel login
- dashboard load after login
- `/calendar`
- `/customers`
- `/services`
- `/settings`
- compatibility redirects when the change touches legacy paths

## Review checklist

- locator quality is semantic
- assertions check user-visible outcomes, not implementation noise
- no arbitrary sleeps
- route names match canonical panel routes
- auth-sensitive flows are not validated only through mocks

## Flake diagnosis pattern

1. Reproduce the failure in headed mode if possible.
2. Inspect network and console.
3. Replace timing assumptions with visibility, URL, or request assertions.
4. Check whether the flake comes from auth/session state rather than the test itself.
5. Re-run the exact test before broadening scope.

## Guardrails

- Do not add a large generated suite if one or two smoke tests would cover the risk.
- Do not rely on test IDs if semantic selectors exist.
- Do not mark a flaky test fixed until it passes more than once without timing hacks.
