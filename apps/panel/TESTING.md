# Testing Guide

## Overview

The frontend application includes both unit tests (Jest) and end-to-end tests (Cypress) to ensure code quality and functionality.

## Unit Tests

Unit tests are written using Jest and React Testing Library.

### Running Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run tests matching a pattern
npm test -- Button
```

### Test Structure

Unit tests are located alongside source files in `__tests__` directories:

- `src/__tests__/` - Tests for utilities and API clients
- Component tests follow the pattern `ComponentName.test.tsx`

### Writing Unit Tests

Example test structure:

```typescript
import { render, screen } from '@testing-library/react';
import Component from './Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## End-to-End Tests (Cypress)

Cypress tests simulate real user interactions with the application.

### Setup

1. Install Cypress dependencies:

    ```bash
    npm run cypress:install
    ```

2. Set up environment variables:
    ```bash
    export NEXT_PUBLIC_API_URL=http://localhost:3000/api
    ```

### Running E2E Tests

#### Development Mode

```bash
# Start the dev server with mocked API URL
NEXT_PUBLIC_API_URL=http://localhost:3000/api npm run dev

# In another terminal:
# Run tests headlessly
npx cypress run

# Open Cypress interactive UI
npx cypress open
```

#### CI/Production Mode

```bash
# Automated build and test
npm run e2e

# This command:
# 1. Builds the application
# 2. Starts the production server
# 3. Runs Cypress tests
# 4. Shuts down the server
```

### Test Files

E2E tests are organized in `cypress/e2e/`:

- `appointments.cy.ts` - Appointment calendar functionality
- `auth.cy.ts` - Authentication flows
- `clients.cy.ts` - Client management
- `dashboard-admin.cy.ts` - Admin dashboard features
- `dashboard-client.cy.ts` - Client dashboard features
- `dashboard-employee.cy.ts` - Employee dashboard features
- `dashboard.cy.ts` - General dashboard navigation
- `employees.cy.ts` - Employee management
- `navigation.cy.ts` - Navigation and routing
- `products.cy.ts` - Product management
- `reviews.cy.ts` - Review functionality
- `services.cy.ts` - Service management
- `auth-register.cy.ts` - Registration flow
- `client-booking.cy.ts` - Client books an appointment
- `admin-manage.cy.ts` - Admin deletes product and edits employee
- `admin-complete.cy.ts` - Admin completes an appointment in Scheduler

### API Mocking

Tests use interceptors to mock API responses, avoiding backend dependencies:

#### Key Files

- `cypress/support/mockLogin.ts` - Authentication mocking utilities
- `cypress/support/api.ts` - Reusable API interceptors
- `cypress/fixtures/` - Mock data files

#### Example Interceptor

```typescript
cy.intercept('GET', '**/api/services*', {
    fixture: 'services.json',
}).as('getServices');

// Later in test
cy.wait('@getServices');
```

### Writing E2E Tests

Basic test structure:

```typescript
describe('Feature', () => {
    beforeEach(() => {
        // Setup authentication
        mockClientLogin();

        // Setup API interceptors
        cy.intercept('GET', '**/api/data', { fixture: 'data.json' }).as(
            'getData',
        );
    });

    it('performs user action', () => {
        cy.visit('/page');
        cy.wait('@getData');

        cy.get('[data-testid="button"]').click();
        cy.contains('Expected Result').should('be.visible');
    });
});
```

### Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Mock all API calls** to ensure test independence
3. **Wait for API responses** using `cy.wait('@alias')`
4. **Use fixtures** for consistent test data
5. **Keep tests focused** - one feature per test
6. **Clean up state** between tests using beforeEach/afterEach

## Troubleshooting

### Common Issues

1. **Tests timeout waiting for API calls**
    - Ensure interceptors match actual request patterns
    - Check that `NEXT_PUBLIC_API_URL` is set correctly
    - Verify interceptors are set up before navigation

2. **Element not found errors**
    - Add explicit waits for dynamic content
    - Use `{ timeout: 10000 }` for slow-loading elements
    - Check if elements are covered by other UI components

3. **Turbopack issues**
    - Remove `--turbopack` flag from dev script
    - Run with `npx next dev` instead

### Debug Tips

- Use `cy.debug()` to pause execution
- Add `cy.log()` statements for debugging
- Run specific tests with `--spec` flag
- Use Cypress UI for visual debugging

## CI/CD Integration

The project is configured to run tests in CI environments:

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: |
      npm ci
      npm run build
      npm run e2e:ci
```

### macOS notes

If Cypress fails to launch due to a quarantine/codesign error, clear the quarantine flag on the installed app:

```bash
xattr -dr com.apple.quarantine ~/Library/Caches/Cypress/14.5.2/Cypress.app
```

If needed, reinstall the binary:

```bash
cd frontend
npm run cypress:install -- --force
```

## Coverage Reports

- Unit test coverage: `npm test -- --coverage`
- Coverage reports are generated in `coverage/` directory
- View HTML report: `open coverage/lcov-report/index.html`
