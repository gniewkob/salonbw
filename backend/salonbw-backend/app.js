const fs = require('fs');
const path = require('path');

const dotenv = require('dotenv');
const envPath = path.join(__dirname, '.env');
const envFile = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};
dotenv.config({ path: envPath, quiet: true, override: envFile.APP_ENV === 'development' });
if (process.env.APP_ENV === 'development') {
  for (const key of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM', 'SMSAPI_TOKEN', 'WHATSAPP_TOKEN', 'WHATSAPP_PHONE_ID', 'VAPID_PRIVATE_KEY', 'VAPID_PUBLIC_KEY', 'INSTAGRAM_ACCESS_TOKEN', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'SENTRY_DSN', 'SENTRY_AUTH_TOKEN']) delete process.env[key];
}
// Hosting optimization is independent of APP_ENV and the isolated development database.
process.env.NODE_ENV = 'production';
process.env.PORT =
  process.env.PORT ||
  process.env.PASSENGER_PORT ||
  process.env.APP_PORT ||
  '3001';

const distRoot = path.join(__dirname, 'dist');
const polyfillCandidates = [
  path.join(distRoot, 'polyfills.js'),
  path.join(distRoot, 'src', 'polyfills.js'),
  path.join(distRoot, 'polyfills.cjs'),
  path.join(distRoot, 'src', 'polyfills.cjs'),
];
const candidates = [
  path.join(distRoot, 'main.js'),
  path.join(distRoot, 'src', 'main.js'),
  path.join(distRoot, 'main.cjs'),
  path.join(distRoot, 'src', 'main.cjs'),
];

const polyfills = polyfillCandidates.find((candidate) => fs.existsSync(candidate));
if (polyfills) {
  require(polyfills);
}

const entry = candidates.find((candidate) => fs.existsSync(candidate));

if (!entry) {
  const listed = candidates.map((candidate) => path.relative(__dirname, candidate)).join(', ');
  throw new Error(
    `Unable to locate compiled backend entry point. Checked: ${listed}.`,
  );
}

require(entry);
