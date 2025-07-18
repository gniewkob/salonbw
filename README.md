# Salon Black & White

This repository contains the Salon Black & White application.
The server is built with [NestJS](https://nestjs.com) in
[`backend/`](backend/), while the web interface uses
[Next.js](https://nextjs.org) in [`frontend/`](frontend/).
See [`backend/README.md`](backend/README.md) for backend setup and
[`frontend/README.md`](frontend/README.md) for running the frontend.

The original Laravel-based frontend has been archived in
[`archive/laravel-frontend`](archive/laravel-frontend) and is no longer
maintained.

## Prerequisites

Install [Node.js](https://nodejs.org/) and npm. The project uses Node.js 20 (see
the [`.nvmrc`](./.nvmrc) file) so any recent 20.x release should work.

## Environment setup

* **Frontend** – create `frontend/.env.local` and set the base API URL:

  ```bash
  NEXT_PUBLIC_API_URL=http://localhost:3001
  ```

* **Backend** – copy `backend/.env.example` to `backend/.env` and adjust the
  values for your local database, JWT secrets and other settings.

## Installing dependencies

Run `npm install` once in each project directory to install all required
packages:

```bash
cd frontend && npm install
cd ../backend && npm install
```

## Developing the frontend

The Next.js development server can be started with:

```bash
cd frontend
npm install    # only required once
npm run dev
```

You can also run it in one line:

```bash
cd frontend && npm run dev
```

Then open <http://localhost:3000> in your browser.

## Common npm scripts

Use these commands inside either `frontend/` or `backend/` as needed:

```bash
npm run dev       # start the development server
npm run lint      # check for linting issues
npm run format    # format the backend codebase (backend only)
```

