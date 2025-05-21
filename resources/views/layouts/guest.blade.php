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
            <a href="{{ route('home') }}" class="text-xl font-bold text-gray-900">Akademia Zdrowych Włosów Black&White</a>
            <nav class="space-x-4 text-sm">
                <a href="{{ route('home') }}" class="{{ request()->routeIs('home') ? 'font-semibold' : '' }}">Strona główna</a>
                <a href="{{ route('uslugi') }}">Usługi</a>
                <a href="{{ route('zespol') }}">Zespół</a>
                <a href="{{ route('kontakt') }}">Kontakt</a>
                @auth
                    <a href="{{ route('dashboard') }}" class="text-blue-600">Panel</a>
                @else
                    <a href="{{ route('login') }}" class="text-blue-600">Zaloguj się</a>
                @endauth
            </nav>
        </div>
    </header>

    <main class="py-8">
        {{ $slot }}
    </main>

    <footer class="bg-gray-100 border-t mt-12">
        <div class="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
            &copy; {{ date('Y') }} Akademia Zdrowych Włosów Black&White — Wszelkie prawa zastrzeżone.
        </div>
    </footer>

</body>
</html>