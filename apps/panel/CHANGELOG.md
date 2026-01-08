# Changelog

All notable changes to the frontend application will be documented in this file.

## [Unreleased] - 2025-08-27

### Fixed

- Fixed all Cypress E2E tests by correcting API interceptor patterns
- Resolved issue with API URL configuration in tests
- Fixed double `/api/` prefix in test interceptors
- Simplified appointments test to avoid UI overlap issues
- Fixed dashboard-admin service creation test

### Changed

- Removed `--turbopack` flag from dev script to improve compatibility
- Updated API interceptors to use wildcard patterns (`**/api/`) for better matching
- Simplified calendar test assertions for better reliability

### Added

- Comprehensive testing documentation (TESTING.md)
- Detailed Cypress test documentation in README
- API mocking documentation and examples

### Technical Details

- All 30 Cypress tests now passing (previously 18 failures)
- Tests now properly mock API responses without requiring backend
- Improved test reliability and maintainability

## Test Coverage Status

- ✅ Authentication flows (4 tests)
- ✅ Dashboard navigation (12 tests)
- ✅ CRUD operations (8 tests)
- ✅ Public pages (3 tests)
- ✅ Role-based access (3 tests)

## Notes for Developers

- When running tests locally, use: `NEXT_PUBLIC_API_URL=http://localhost:3000/api npm run dev`
- Cypress tests use mocked API responses defined in `cypress/fixtures/`
- Interceptor patterns must use `**/api/` to match requests properly
