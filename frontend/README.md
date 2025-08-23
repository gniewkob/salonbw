# Salon Black & White Frontend

This directory contains the Next.js application powering the public website and dashboard.

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

- `npm run dev` – start the development server with Tailwind watching for changes
- `npm run lint` – check the code with ESLint
- `npm run format` – format source files with Prettier

When `npm run dev` is running, Tailwind CSS classes are compiled on the fly
using the configuration in `tailwind.config.ts` and the global styles in
`src/styles/globals.css`.

## Features

- **Marketing pages** under `src/pages` (`index`, `services`, `gallery`, `contact`).
- **Authentication** routes in `src/pages/auth` with login and registration forms.
- **Role-based dashboard** pages under `src/pages/dashboard` for clients, employees and admins.
- Navigation components in `src/components` (`Navbar` and `DashboardNav`) rendered via the global `Layout`.
- Configure the backend API URL via `NEXT_PUBLIC_API_URL` in `.env.local` (copied from `.env.local.example`).

## Manual Testing

- Start the app with `npm run dev`.
- Log in using an existing account.
- Log out.
- Navigate to `/dashboard`.
- Confirm you are redirected to `/auth/login`.

Run unit tests with `npm test`.
