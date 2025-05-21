<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>{{ config('app.name', 'Salon Black&White') }}</title>
	@vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="font-sans antialiased bg-white text-gray-800">

	<header class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
			<a href="{{ route('dashboard') }}" class="text-xl font-bold text-gray-900">Panel administracyjny</a>
			<nav class="space-x-4 text-sm">
				<a href="{{ route('dashboard') }}">Dashboard</a>
				<a href="{{ route('appointments.index') }}">Moje rezerwacje</a>
				<a href="{{ route('admin.services.index') }}">Usługi</a>
				<a href="{{ route('admin.kontakt') }}">Wiadomości</a>

				<!-- Logout -->
				<form method="POST" action="{{ route('logout') }}" class="inline">
					@csrf
					<button type="submit" class="text-gray-600 hover:underline">{{ Auth::user()->name }} (Wyloguj)</button>
				</form>
			</nav>
		</div>
	</header>

	<main class="py-8">
		{{ $slot }}
	</main>

	<footer class="bg-gray-100 border-t mt-12">
		<div class="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
			&copy; {{ date('Y') }} Akademia Zdrowych Włosów Black&White — Panel zarządzania.
		</div>
	</footer>

</body>
</html>