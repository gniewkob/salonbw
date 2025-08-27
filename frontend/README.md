# Salon Black & White Frontend

This directory contains the Next.js application powering the public website and dashboard.

## Quick Links

- [Testing Guide](./TESTING.md) - Comprehensive testing documentation
- [Changelog](./CHANGELOG.md) - Recent changes and updates

## Installation

Install dependencies using npm:

```bash
cd frontend
npm install
```

Copy `.env.local.example` to `.env.local` and adjust the API URL if needed. This value is
read by Next.js at build and runtime and should point to the running backend:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Available scripts

Run these commands from the `frontend` folder:

- `npm run dev` – start the development server (Note: remove `--turbopack` flag if you encounter issues)
- `npm run build` – build the application for production
- `npm run start` – start the production server
- `npm run lint` – check the code with ESLint
- `npm run format` – format source files with Prettier
- `npm test` – run unit tests with Jest
- `npm run e2e` – run end-to-end tests with Cypress
- `npm run cypress:install` – install Cypress binary

When `npm run dev` is running, Tailwind CSS classes are compiled on the fly
using the configuration in `tailwind.config.ts` and the global styles in
`src/styles/globals.css`.

## Features

- **Marketing pages** under `src/pages` (`index`, `services`, `gallery`, `contact`).
- **Authentication** routes in `src/pages/auth` with login and registration forms.
- **Role-based dashboard** pages under `src/pages/dashboard` for clients, employees and admins.
- Navigation components in `src/components` (`Navbar` and `DashboardNav`) rendered via the global `Layout`.
- Configure the backend API URL via `NEXT_PUBLIC_API_URL` in `.env.local` (copied from `.env.local.example`).

## Testing

### Unit Tests

Run unit tests with Jest:

```bash
npm test
# or with coverage
npm test -- --coverage
```

### End-to-End Tests

The project uses Cypress for E2E testing. Tests are located in `cypress/e2e/`.

#### Running Cypress Tests

1. **For development with mocked API:**
   ```bash
   # Start dev server with proper API URL
   NEXT_PUBLIC_API_URL=http://localhost:3000/api npm run dev
   
   # In another terminal, run Cypress tests
   npx cypress run
   # or open Cypress UI
   npx cypress open
   ```

2. **Using the automated e2e script:**
   ```bash
   npm run e2e
   ```
   This will build the app and run tests automatically.

#### Test Coverage

The Cypress test suite covers:
- Authentication flows (login, logout, redirects)
- Dashboard navigation for different user roles (admin, employee, client)
- CRUD operations for services, employees, products, reviews
- Public page navigation
- Appointment calendar functionality

#### API Mocking

Cypress tests use interceptors to mock API responses. Key files:
- `cypress/support/mockLogin.ts` – handles authentication mocking
- `cypress/support/api.ts` – provides reusable API interceptors
- `cypress/fixtures/` – contains mock data

### Manual Testing

- Start the app with `npm run dev`
- Log in using an existing account
- Log out
- Navigate to `/dashboard`
- Confirm you are redirected to `/auth/login`
