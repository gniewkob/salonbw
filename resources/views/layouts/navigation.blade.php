<nav class="bg-white border-b">
    <div class="max-w-7xl mx-auto px-4 py-3">
        <div class="flex flex-wrap items-center justify-between gap-4">
            {{-- Lewa sekcja --}}
            <div class="flex flex-wrap items-center gap-6">
                <a href="{{ route('home') }}" class="font-bold text-lg flex items-center">
                    <x-heroicon-o-home class="w-5 h-5 mr-1 text-gray-700" />
                    Salon Black&White
                </a>
                <a href="{{ route('uslugi') }}" class="flex items-center text-gray-700 hover:underline">
                    <x-heroicon-o-scissors class="w-5 h-5 mr-1 text-gray-500" />
                    Usługi
                </a>
                <a href="{{ route('kontakt') }}" class="flex items-center text-gray-700 hover:underline">
                    <x-heroicon-o-envelope class="w-5 h-5 mr-1 text-gray-500" />
                    Kontakt
                </a>
            </div>

            {{-- Prawa sekcja --}}
            <div class="flex items-center gap-4">
                @auth
                    <form method="POST" action="{{ route('logout') }}" class="flex items-center">
                        @csrf
                        <button type="submit" class="text-red-600 hover:underline flex items-center">
                            <x-heroicon-o-arrow-left-on-rectangle class="w-5 h-5 mr-1" />
                            Wyloguj
                        </button>
                    </form>
                @else
                    <a href="{{ route('register') }}" class="hover:underline flex items-center">
                        <x-heroicon-o-user-plus class="w-5 h-5 mr-1" />
                        Zarejestruj się
                    </a>
                    <a href="{{ route('login') }}" class="hover:underline flex items-center">
                        <x-heroicon-o-arrow-right-on-rectangle class="w-5 h-5 mr-1" />
                        Zaloguj się
                    </a>
                @endauth
            </div>
        </div>

        {{-- Linki użytkownika/admina --}}
        @auth
        <div class="mt-4 pt-2 border-t flex flex-wrap gap-6 text-sm">
            @if(Auth::user()->role === 'admin')
                <a href="{{ route('admin.services.index') }}" class="flex items-center text-gray-700 hover:underline">
                    <x-heroicon-o-cog class="w-4 h-4 mr-1 text-gray-500" />
                    Usługi (admin)
                </a>
                <a href="{{ route('admin.calendar') }}" class="flex items-center text-gray-700 hover:underline">
                    <x-heroicon-o-calendar class="w-4 h-4 mr-1 text-gray-500" />
                    Kalendarz
                </a>
                <a href="{{ route('admin.kontakt') }}" class="flex items-center text-gray-700 hover:underline">
                    <x-heroicon-o-phone class="w-4 h-4 mr-1 text-gray-500" />
                    Kontakt
                </a>
                <a href="{{ route('admin.messages.index') }}" class="flex items-center text-gray-700 hover:underline">
                    <x-heroicon-o-chat-bubble-left class="w-4 h-4 mr-1 text-gray-500" />
                    Wiadomości
                </a>
                <a href="{{ route('admin.users.index') }}" class="flex items-center text-gray-700 hover:underline">
                    <x-heroicon-o-user-group class="w-4 h-4 mr-1 text-gray-500" />
                    Użytkownicy
                </a>
            @else
                <a href="{{ route('appointments.index') }}" class="flex items-center text-gray-700 hover:underline">
                    <x-heroicon-o-calendar-days class="w-4 h-4 mr-1 text-gray-500" />
                    Moje rezerwacje
                </a>
                <a href="{{ route('messages.index') }}" class="flex items-center text-gray-700 hover:underline">
                    <x-heroicon-o-chat-bubble-left class="w-4 h-4 mr-1 text-gray-500" />
                    Wiadomości
                </a>
            @endif
        </div>
        @endauth
    </div>
</nav>
