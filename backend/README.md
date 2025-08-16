# Gliwicka111 v2

## Verification

1. Copy `.env.example` to `.env` and ensure it contains `DATABASE_URL` (e.g., `postgres://user:password@localhost:5432/database`).
   `FRONTEND_URL` is optional; when omitted, WebSocket CORS allows requests from any origin.
2. Start PostgreSQL using those credentials. One way is:
   - `sudo service postgresql start`
   - `sudo -u postgres psql -c "CREATE USER \"user\" WITH PASSWORD 'password';"`
   - `sudo -u postgres psql -c "CREATE DATABASE database OWNER \"user\";"`
3. In `backend/salonbw-backend`, install dependencies with `npm ci` (or `npm install`). Run this before `npm run start:dev` or `npm test`.
4. From `backend/salonbw-backend` run `npm run start:dev` and confirm it connects to the database without errors.
5. In a separate terminal, check the health endpoint:
   ```bash
   curl http://localhost:3000/health
   ```
   Expected output: `{"status":"ok"}` with HTTP status `200`.

## Notes

- TypeORM synchronization is enabled only for development. In production environments set `NODE_ENV=production` and run migrations instead of relying on synchronization.
