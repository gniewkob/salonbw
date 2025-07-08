<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Salon Black & White

Salon Black & White is a modern hair salon website built with Laravel.
It lets clients book appointments, browse a gallery of our work and contact us directly.
The application integrates with WhatsApp and Instagram to keep customers up to date.

## License

This project is open-sourced software licensed under the [MIT license](LICENSE).

## Requirements

Running the application requires PHP 8.2 or later with the DOM and XML extensions enabled. Make sure the `composer` command is available on your system. The NestJS service depends on **Node.js 20** or newer and **TypeScript 5.7** or newer.

## Setup

Install the dependencies and compile the assets before running the project locally. Start by creating the environment file and providing any required variables.

```bash
cp .env.example .env
# edit `.env` and set APP_KEY, WHATSAPP_TOKEN, WHATSAPP_PHONE_ID and INSTAGRAM_ACCESS_TOKEN
# optionally set WHATSAPP_TEMPLATE_LANG (defaults to "pl")

composer install
npm install
npm run build

touch database/database.sqlite
php artisan migrate
```

Run the test suite to ensure everything works correctly:

```bash
composer test
```


## WhatsApp Notifications

The application integrates with the [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/) to deliver messages. Add the credentials below to your `.env` file:

```
WHATSAPP_TOKEN=your-access-token       # access token for the Cloud API
WHATSAPP_PHONE_ID=your-phone-id        # identifier of the sending phone number
# Optional, defaults to "pl"
WHATSAPP_TEMPLATE_LANG=pl
```

`WHATSAPP_TOKEN` and `WHATSAPP_PHONE_ID` come from your Meta Business account. They allow the custom notification channel to authenticate and send templated messages from the specified number.

## Instagram Integration

Recent posts in the gallery are fetched using the Instagram API. Set `INSTAGRAM_ACCESS_TOKEN` in your `.env` file to enable this feature.

## NestJS Backend

The `backend` directory contains a NestJS service that powers the API.

### Backend Setup
Before running the NestJS server or any tests make sure to install the
backend dependencies, generate the Prisma client, and compile the project:

```bash
cp backend/.env.example backend/.env
# fill in DATABASE_URL and JWT_SECRET
cd backend
npm install
npx prisma generate
npm run build
```

Start the service in watch mode while developing:

```bash
npm run start:dev
```

### Prisma migrations

Run Prisma migrations using the CLI:

```bash
npx prisma migrate deploy
# or, for local development
npx prisma migrate dev
```

### E2E tests

Execute the backend's end-to-end tests from the repository root. The command
relies on the dependencies installed in **Backend Setup**:

```bash
npm run test:e2e
```

### Running the backend on FreeBSD

The API server can be built on macOS or Linux and copied to a FreeBSD
machine. Follow the "Run on FreeBSD" section in `backend/README.md` for
detailed steps.
