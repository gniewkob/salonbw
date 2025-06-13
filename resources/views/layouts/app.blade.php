<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>{{ config('app.name', 'Salon Black&White') }}</title>

  @vite(['resources/css/app.css', 'resources/js/app.js'])
  @stack('styles')
  @stack('head')
</head>
<body class="bg-gray-50 antialiased">
  @include('layouts.navigation')
  <main class="py-8 min-h-screen">{{ $slot }}</main>
  <footer class="bg-gray-100 border-t py-6 text-center text-sm text-gray-600">
	&copy; {{ date('Y') }} Akademia Zdrowych Włosów Black&White — Panel zarządzania.
  </footer>
  @stack('scripts')
</body>
</html>
