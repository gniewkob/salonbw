# Deployment Guide

## Environment Configuration

The application uses environment variables for configuration. The priority order is:

1. System environment variables (highest priority)
2. `.env.production` (production specific)
3. `.env.local` (local overrides)
4. `.env` (default values)

## Development vs Production

### Development Mode

For local development with automatic port management:

```bash
npm run dev
```

This will:

- Load environment from `.env.local` or `.env`
- Automatically find available port if 3000 is occupied
- Enable hot reload and development features

### Production Mode

For production deployment:

```bash
# Build the application
npm run build:production

# Start production server
npm run start:production
```

Or using environment variables directly:

```bash
# Set environment variables
export NODE_ENV=production
export PORT=3000
export NEXT_PUBLIC_API_URL=https://api.example.com

# Build and start
npm run build
npm start
```

## Configuration Files

### `.env.local` (Development)

```env
# Development configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
# PORT is managed automatically in dev mode
```

### `.env.production` (Production)

```env
# Production configuration
NODE_ENV=production
PORT=3000  # Fixed port for production
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_SITE_URL=https://example.com
```

## Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build the application
ENV NODE_ENV=production
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts

# Set production environment
ENV NODE_ENV=production

# Expose port (will be overridden by PORT env var)
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:production"]
```

## Cloud Deployment

### Vercel

1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### AWS EC2 / DigitalOcean

1. Set up Node.js 20+ on your server
2. Clone the repository
3. Create `.env.production` with your configuration
4. Install dependencies and build:

```bash
npm ci
npm run build:production
```

5. Use PM2 for process management:

```bash
npm install -g pm2
pm2 start npm --name "frontend" -- run start:production
pm2 save
pm2 startup
```

### Heroku

Create `Procfile`:

```
web: npm run start:production
```

Set environment variables:

```bash
heroku config:set NODE_ENV=production
heroku config:set NEXT_PUBLIC_API_URL=https://api.example.com
```

## Environment Variables Reference

| Variable                       | Required | Default     | Description              |
| ------------------------------ | -------- | ----------- | ------------------------ |
| `NEXT_PUBLIC_API_URL`          | Yes      | -           | Backend API URL          |
| `PORT`                         | No       | 3000        | Server port (production) |
| `NODE_ENV`                     | No       | development | Environment mode         |
| `NEXT_PUBLIC_SITE_URL`         | No       | -           | Public site URL          |
| `NEXT_PUBLIC_GA_ID`            | No       | -           | Google Analytics ID      |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | No       | false       | Enable analytics         |
| `NEXT_PUBLIC_ENABLE_DEBUG`     | No       | false       | Enable debug mode        |

## Health Checks

The application provides health endpoints:

- `/` - Main page (should return 200)
- `/api/health` - Health check endpoint (if implemented)

## Monitoring

For production monitoring, consider:

1. **Application Monitoring**: New Relic, DataDog, or Sentry
2. **Logs**: CloudWatch, LogDNA, or Papertrail
3. **Uptime**: UptimeRobot, Pingdom, or StatusCake

## Security Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS in production
- [ ] Set secure headers (CSP, HSTS, etc.)
- [ ] Enable rate limiting
- [ ] Keep dependencies updated
- [ ] Use secrets management for sensitive data
- [ ] Configure CORS properly
- [ ] Disable debug mode in production

## Troubleshooting

### Port already in use

```bash
# Clean up ports
npm run ports:cleanup

# Check available ports
npm run ports:check
```

### Production build fails

```bash
# Clear cache and rebuild
rm -rf .next
npm run build:production
```

### Environment variables not loading

1. Check file exists (`.env.production` or `.env`)
2. Verify no syntax errors in env files
3. Ensure variables start with `NEXT_PUBLIC_` for client-side access
4. Rebuild after changing env variables

## MyDevil.net (Passenger) Hosting

When deploying on mydevil.net with Phusion Passenger for Node.js:

- Deploy path: `/usr/home/<LOGIN>/domains/<DOMAIN>/public_nodejs`.
- Upload:
  - `.next/standalone/` → `public_nodejs/.next/standalone/`
  - `.next/static/` → `public_nodejs/.next/static/`
  - `public/` → `public_nodejs/public/`
  - `frontend/app.js` → `public_nodejs/app.js` (entry that runs `node .next/standalone/server.js`).
- Environment for Passenger: set in `~/.bash_profile` (not `.bashrc`), e.g.:

```bash
export NODE_ENV=production
export NEXT_PUBLIC_API_URL=https://api.example.com   # or /api if proxied on same domain
```

Then relogin or `source ~/.bash_profile`.

- Restart after deploy: `devil www restart <DOMAIN>`.
- Static files under `public_nodejs/public` are served directly by Nginx.

The CI workflow `deploy.yml` supports rsync to the remote path and restart; pass `remote_path` to `public_nodejs`, `app_name` (domain/app), and `api_url` to embed the correct API base during build.
