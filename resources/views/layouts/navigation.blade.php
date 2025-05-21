<nav class="bg-white border-b">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center space-x-8">
            <a href="{{ route('home') }}" class="font-bold text-lg">Salon Black&White</a>
            <a href="{{ route('uslugi') }}" class="hover:underline">Usługi</a>
            <a href="{{ route('zespol') }}" class="hover:underline">Zespół</a>
            <a href="{{ route('kontakt') }}" class="hover:underline">Kontakt</a>
            @auth
                @if(Auth::user()->role === 'admin')
                    <a href="{{ route('admin.appointments.index') }}" class="hover:underline">Rezerwacje</a>
                    <a href="{{ route('admin.services.index') }}" class="hover:underline">Usługi (admin)</a>
                    <a href="{{ route('admin.kontakt') }}" class="hover:underline">Wiadomości</a>
                    <a href="{{ route('admin.users.index') }}" class="hover:underline">Użytkownicy</a>
                    <a href="{{ route('admin.calendar') }}" class="hover:underline">Kalendarz</a>
                @else
                    <a href="{{ route('appointments.index') }}" class="hover:underline">Moje wizyty</a>
                    <a href="{{ route('appointments.create') }}" class="hover:underline">Nowa rezerwacja</a>
                @endif
            @endauth
        </div>
        <div>
            @auth
                <a href="{{ route('dashboard') }}" class="ml-4 hover:underline">Panel</a>
                <form method="POST" action="{{ route('logout') }}" class="inline">
                    @csrf
                    <button type="submit" class="ml-4 text-red-700 hover:underline">Wyloguj</button>
                </form>
            @else
                <a href="{{ route('login') }}" class="hover:underline">Zaloguj się</a>
            @endauth
        </div>
    </div>
</nav>
