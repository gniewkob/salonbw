<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>{{ config('app.name', 'Salon Black&White') }}</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Open+Sans:wght@400;700&display=swap" rel="stylesheet">

  @vite(['resources/css/app.css', 'resources/js/app.js'])
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""
  />
  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""
  ></script>
  <style>
    [x-cloak] { display: none !important; }
  </style>
  @stack('styles')
  @stack('head')
</head>
<body class="bg-gray-50 antialiased">
  @include('layouts.navigation')
  <main class="py-8 min-h-screen">{{ $slot }}</main>
  <footer class="bg-gray-100 border-t mt-12">
        <div class="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600 space-y-2">
            <div>&copy; {{ date('Y') }} Akademia Zdrowych Włosów Black&White — Panel zarządzania.</div>
            <div class="space-x-4">
                <a href="{{ route('privacy') }}" class="hover:underline">Polityka prywatności</a>
                <a href="{{ route('cookies') }}" class="hover:underline">Polityka cookies</a>
                <a href="{{ route('terms') }}" class="hover:underline">Regulamin</a>
                <a href="{{ route('kontakt') }}" class="hover:underline">Kontakt</a>
                <a href="{{ route('complaints') }}" class="hover:underline">Reklamacje</a>
                <a href="{{ route('consents') }}" class="hover:underline">Twoje zgody</a>
            </div>
        </div>
  </footer>
  @stack('scripts')
  <!-- Matomo -->
  <script>
    var _paq = window._paq = window._paq || [];
    /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    (function() {
      var u="//stats0.mydevil.net/";
      _paq.push(['setTrackerUrl', u+'matomo.php']);
      _paq.push(['setSiteId', '584']);
      var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
      g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
    })();
  </script>
  <!-- End Matomo Code -->
</body>
</html>
