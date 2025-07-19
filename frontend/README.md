# Salon Black & White Frontend

This directory contains the Next.js application powering the public website and dashboard.

## Installation

Install dependencies using npm:

```bash
cd frontend
npm install
```

Create a `.env.local` file with the API URL used by the frontend:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Available scripts

Run these commands from the `frontend` folder:

- `npm run dev` – start the development server
- `npm run lint` – check the code with ESLint
- `npm run format` – format source files with Prettier

## Features

- **Marketing pages** under `src/pages` (`index`, `services`, `gallery`, `contact`).
- **Authentication** routes in `src/pages/auth` with login and registration forms.
- **Role-based dashboard** pages under `src/pages/dashboard` for clients, employees and admins.
- Navigation components in `src/components` (`PublicNav` and `DashboardNav`) rendered via the global `Layout`.
- Configure the backend API URL via `NEXT_PUBLIC_API_URL`.
