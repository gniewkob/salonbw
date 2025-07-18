# Salon Black & White

Salon Black & White now consists of a
[NestJS](https://nestjs.com) backend in [`backend/`](backend/) and a
[Next.js](https://nextjs.org) frontend in [`frontend/`](frontend/).
To get each part running, follow
[`backend/README.md`](backend/README.md) for backend instructions and
[`frontend/README.md`](frontend/README.md) for the frontend.

The old Laravel-based frontend has been archived in
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

