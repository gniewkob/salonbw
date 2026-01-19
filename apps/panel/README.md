# Salon Black & White Frontend

This directory contains the Next.js application powering the public website and dashboard.

## Quick Links

- [Testing Guide](./TESTING.md) - Comprehensive testing documentation
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
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

- `npm run dev` – start the development server with smart port management
- `npm run dev:raw` – start Next.js dev server directly (without port management)
- `npm run build` – build the application for production
- `npm run analyze` – build with bundle analyzer (requires @next/bundle-analyzer)
- `npm run build:production` – build with NODE_ENV=production
- `npm run start` – start the production server
- `npm run start:production` – start with production configuration
- `npm run lint` – check the code with ESLint
- `npm run format` – format source files with Prettier
- `npm test` – run unit tests with Jest
- `npm run e2e` – run end-to-end tests with Cypress (cleans ports first)
- `npm run cypress:install` – install Cypress binary
- `npm run ports:cleanup` – clean up common development ports (3000-3003)
- `npm run ports:check` – check for available port starting from 3000

When `npm run dev` is running, Tailwind CSS classes are compiled on the fly
using the configuration in `tailwind.config.ts` and the global styles in
`src/styles/globals.css`.

## Port Management

The application includes smart port management to handle conflicts when multiple Node.js applications are running:

### Automatic Port Selection

When running `npm run dev`, the script will:

1. Check if port 3000 is available
2. If occupied, offer to kill the process or find an alternative port
3. Automatically start on the next available port in CI/automated environments

### Manual Port Management

```bash
# Clean up all common development ports (3000-3003)
npm run ports:cleanup

# Check which port is available
npm run ports:check

# Kill specific port
node scripts/server-utils.js kill 3000
```

### Why This Matters

When working with multiple Node.js projects, port conflicts are common. This system:

- Prevents "EADDRINUSE" errors
- Automatically finds available ports
- Provides cleanup utilities
- Makes testing more reliable

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

3. **First-time Cypress install:**
    ```bash
    npm run cypress:install
    ```
    On macOS, if Cypress fails to open due to codesign/quarantine, clear the quarantine flag:
    ```bash
    xattr -dr com.apple.quarantine ~/Library/Caches/Cypress/14.5.2/Cypress.app
    ```

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

Additional scenarios included:

- Registration: `auth-register.cy.ts`
- Client booking: `client-booking.cy.ts`
- Admin management: `admin-manage.cy.ts`
- Admin Scheduler completion: `admin-complete.cy.ts`

### Bundle Analysis

Generate a bundle analysis to inspect chunk sizes:

```bash
# Install once locally
npm i -D @next/bundle-analyzer

# Build with analysis
npm run analyze
```

The report opens automatically with details on server and client bundles.

### Optional Sentry Integration

The project already initialises `@sentry/nextjs` when the DSN is provided. To enable tracing/RUM, configure the following:

```bash
NEXT_PUBLIC_SENTRY_DSN=your_dsn
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0      # optional passive replay sampling
NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1     # capture a replay whenever an error fires
```

Web Vitals and slow navigation events are forwarded to Sentry metrics automatically; Replay sampling is optional but recommended on staging and disabled (0) on production if you have strict PII requirements.

### Manual Testing

- Start the app with `npm run dev`
- Log in using an existing account
- Log out
- Navigate to `/dashboard`
- Confirm you are redirected to `/auth/login`
