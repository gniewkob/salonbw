<nav class="bg-white border-b">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {{-- Lewa strona: główne linki --}}
        <div class="flex items-center space-x-8">
            <a href="{{ route('home') }}" class="font-bold text-lg">Salon Black&White</a>
            <a href="{{ route('uslugi') }}" class="hover:underline">Usługi</a>
            <a href="{{ route('kontakt') }}" class="hover:underline">Kontakt</a>
            @auth
                @if(Auth::user()->role === 'admin')
                    <a href="{{ route('admin.services.index') }}" class="hover:underline">Usługi (admin)</a>
                    <a href="{{ route('admin.calendar') }}" class="hover:underline">Kalendarz</a>
                    <a href="{{ route('admin.kontakt') }}" class="hover:underline">Wiadomości</a>
                    <a href="{{ route('admin.users.index') }}" class="hover:underline">Użytkownicy</a>
                    {{-- Dodaj tutaj link do edycji strony głównej jeśli utworzysz trasę, np. admin.home --}}
                @else
                    <a href="{{ route('appointments.index') }}" class="hover:underline">Moje rezerwacje</a>
                    {{-- Brak trasy do wiadomości użytkownika, możesz dodać tutaj gdy ją zrobisz --}}
                @endif
            @endauth
        </div>
        {{-- Prawa strona: logowanie/rejestracja lub wylogowanie --}}
        <div class="flex items-center space-x-4">
            @auth
                <form method="POST" action="{{ route('logout') }}" class="inline">
                    @csrf
                    <button type="submit" class="text-red-700 hover:underline">Wyloguj</button>
                </form>
            @else
                <a href="{{ route('register') }}" class="hover:underline">Zarejestruj się</a>
                <a href="{{ route('login') }}" class="hover:underline">Zaloguj się</a>
            @endauth
        </div>
    </div>
</nav>
