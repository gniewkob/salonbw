<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ config('app.name', 'Salon Black&White') }}</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @stack('styles')
    @stack('head')
</head>
<body class="bg-gray-50 min-h-screen antialiased">
    {{-- Nawigacja (możesz zrobić layouts/navigation-public.blade.php jeśli chcesz uproszczoną wersję) --}}
    @include('layouts.navigation')

    <main class="py-12 min-h-[70vh]">
        {{ $slot }}
    </main>

    <footer class="bg-gray-100 border-t mt-12">
        <div class="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
            &copy; {{ date('Y') }} Akademia Zdrowych Włosów Black&White
        </div>
    </footer>
    @stack('scripts')
</body>
</html>
