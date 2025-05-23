<!DOCTYPE html>
<html lang="pl">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="csrf-token" content="{{ csrf_token() }}">
	<title>{{ config('app.name', 'Salon Black&White') }}</title>

	{{-- FullCalendar CSS (wersja 6.3.5) --}}
	<link
	  rel="stylesheet"
	  href="https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.3.5/main.min.css"
	/>
	<link
	  rel="stylesheet"
	  href="https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.3.5/main.min.css"
	/>
	<link
	  rel="stylesheet"
	  href="https://cdn.jsdelivr.net/npm/@fullcalendar/timegrid@6.3.5/main.min.css"
	/>

	{{-- Vite --}}
	@vite(['resources/css/app.css', 'resources/js/app.js'])
	@stack('head')
</head>
<body class="bg-gray-50 antialiased">
	@include('layouts.navigation')

	<main class="py-8 min-h-screen">
		{{ $slot }}
	</main>

	<footer class="bg-gray-100 border-t">
		<div class="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
			&copy; {{ date('Y') }} Akademia Zdrowych Włosów Black&White — Panel zarządzania.
		</div>
	</footer>

	@stack('scripts')
</body>
</html>
