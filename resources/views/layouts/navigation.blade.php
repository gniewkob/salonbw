<nav x-data="{ open: false }" class="bg-white border-b sticky top-0 z-50">
    @php
        use Illuminate\Support\Facades\Auth;
        use App\Models\KontaktMessage;

        $unreadMessages = 0;
        if (Auth::check()) {
            if (Auth::user()->role === 'admin') {
                $unreadMessages = KontaktMessage::where('is_from_admin', false)
                    ->whereNull('reply_to_id')
                    ->where(function ($query) {
                        $query->whereDoesntHave('replies', function ($q) {
                            $q->where('is_from_admin', true);
                        })->orWhereHas('replies', function ($q) {
                            $q->where('is_from_admin', false)
                                ->where('is_read', false);
                        });
                    })
                    ->count();
            } else {
                $unreadMessages = KontaktMessage::where('user_id', Auth::id())
                    ->where('is_from_admin', true)
                    ->where('is_read', false)
                    ->count();
            }
        }
    @endphp
    <div class="max-w-7xl mx-auto px-4">
        <div class="flex justify-between items-center py-4">
            <div class="flex items-center">
                <a href="{{ route('home') }}" class="font-bold text-lg flex items-center">
                    <x-heroicon-o-home class="w-5 h-5 mr-1 text-gray-700" />
                    Salon Black&White
                </a>
                <div class="hidden md:flex space-x-6 ml-6">
                    <a href="{{ route('uslugi') }}" class="text-gray-700 hover:text-indigo-600">Usługi</a>
                    <a href="{{ route('gallery') }}" class="text-gray-700 hover:text-indigo-600">Galeria</a>
                    <a href="{{ route('faq') }}" class="text-gray-700 hover:text-indigo-600">FAQ</a>
                    <a href="{{ route('kontakt') }}" class="text-gray-700 hover:text-indigo-600">Kontakt</a>
                </div>
            </div>
            <div class="flex items-center space-x-4">
                <a href="{{ route('reservation.entry') }}" class="hidden md:inline-block bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition">Rezerwuj</a>
                <button @click="open = !open" class="md:hidden focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25h16.5m-16.5 6h16.5m-16.5 6h16.5" />
                    </svg>
                </button>
                @auth
                    <form method="POST" action="{{ route('logout') }}" class="hidden md:inline-flex items-center">
                        @csrf
                        <button type="submit" class="text-red-600 hover:underline flex items-center">
                            <x-heroicon-o-arrow-left-on-rectangle class="w-5 h-5 mr-1" />
                            Wyloguj
                        </button>
                    </form>
                @else
                    <a href="{{ route('register') }}" class="hidden md:inline-flex hover:underline items-center">
                        <x-heroicon-o-user-plus class="w-5 h-5 mr-1" />
                        Rejestracja
                    </a>
                    <a href="{{ route('login') }}" class="hidden md:inline-flex hover:underline items-center">
                        <x-heroicon-o-arrow-right-on-rectangle class="w-5 h-5 mr-1" />
                        Logowanie
                    </a>
                @endauth
            </div>
        </div>
        <div x-show="open" class="md:hidden pb-4 space-y-2">
            <a href="{{ route('uslugi') }}" class="block text-gray-700">Usługi</a>
            <a href="{{ route('gallery') }}" class="block text-gray-700">Galeria</a>
            <a href="{{ route('faq') }}" class="block text-gray-700">FAQ</a>
            <a href="{{ route('kontakt') }}" class="block text-gray-700">Kontakt</a>
            <a href="{{ route('reservation.entry') }}" class="block text-indigo-600 font-semibold">Rezerwuj</a>
            @auth
                @if(Auth::user()->role === 'admin')
                    <a href="{{ route('dashboard') }}" class="block text-gray-700">Dashboard</a>
                    <a href="{{ route('admin.services.index') }}" class="block text-gray-700">Usługi (admin)</a>
                    <a href="{{ route('admin.calendar') }}" class="block text-gray-700">Kalendarz</a>
                    <a href="{{ route('admin.blockers.calendar') }}" class="block text-gray-700">Blokady</a>
                    <a href="{{ route('admin.kontakt.edit') }}" class="block text-gray-700">Kontakt</a>
                    <a href="{{ route('admin.messages.index') }}" class="block text-gray-700">Wiadomości
                        @if($unreadMessages > 0)
                            <span class="ml-1 bg-red-500 text-white rounded-full px-2 text-xs">{{ $unreadMessages }}</span>
                        @endif
                    </a>
                    <a href="{{ route('admin.users.index') }}" class="block text-gray-700">Użytkownicy</a>
                @else
                    <a href="{{ route('dashboard') }}" class="block text-gray-700">Dashboard</a>
                    <a href="{{ route('appointments.index') }}" class="block text-gray-700">Moje rezerwacje</a>
                    <a href="{{ route('appointments.calendar') }}" class="block text-gray-700">Kalendarz wizyt</a>
                    <a href="{{ route('messages.index') }}" class="block text-gray-700">Wiadomości
                        @if($unreadMessages > 0)
                            <span class="ml-1 bg-red-500 text-white rounded-full px-2 text-xs">{{ $unreadMessages }}</span>
                        @endif
                    </a>
                @endif
                <form method="POST" action="{{ route('logout') }}" class="block">
                    @csrf
                    <button type="submit" class="text-red-600 underline">Wyloguj</button>
                </form>
            @else
                <a href="{{ route('register') }}" class="block">Rejestracja</a>
                <a href="{{ route('login') }}" class="block">Logowanie</a>
            @endauth
        </div>
        @auth
        <div class="hidden md:flex mt-4 pt-2 border-t flex-wrap gap-6 text-sm">
            @if(Auth::user()->role === 'admin')
                <a href="{{ route('dashboard') }}" class="flex items-center text-gray-700 hover:underline">
                    <x-heroicon-o-home-modern class="w-4 h-4 mr-1 text-gray-500" />
                    Dashboard
                </a>
                <a href="{{ route('admin.services.index') }}" class="flex items-center text-gray-700 hover:underline">
                    <x-heroicon-o-cog class="w-4 h-4 mr-1 text-gray-500" />
                    Usługi (admin)
                </a>
                <a href="{{ route('admin.calendar') }}" class="flex items-center text-gray-700 hover:underline">
                    <x-heroicon-o-calendar class="w-4 h-4 mr-1 text-gray-500" />
                    Kalendarz
                </a>
                <a href="{{ route('admin.blockers.calendar') }}" class="flex items-center text-gray-700 hover:underline">
                    <x-heroicon-o-lock-closed class="w-4 h-4 mr-1 text-gray-500" />
                    Blokady
                </a>
                <a href="{{ route('admin.kontakt.edit') }}" class="flex items-center text-gray-700 hover:underline">
                    <x-heroicon-o-phone class="w-4 h-4 mr-1 text-gray-500" />
                    Kontakt
                </a>
                <a href="{{ route('admin.messages.index') }}" class="flex items-center text-gray-700 hover:underline">
                    <x-heroicon-o-chat-bubble-left class="w-4 h-4 mr-1 text-gray-500" />
                    Wiadomości
                    @if($unreadMessages > 0)
                        <span class="ml-1 bg-red-500 text-white rounded-full px-2 text-xs">{{ $unreadMessages }}</span>
                    @endif
                </a>
                <a href="{{ route('admin.users.index') }}" class="flex items-center text-gray-700 hover:underline">
                    <x-heroicon-o-user-group class="w-4 h-4 mr-1 text-gray-500" />
                    Użytkownicy
                </a>
            @else
                <a href="{{ route('dashboard') }}" class="flex items-center text-gray-700 hover:underline">
                    <x-heroicon-o-home-modern class="w-4 h-4 mr-1 text-gray-500" />
                    Dashboard
                </a>
                <a href="{{ route('appointments.index') }}" class="flex items-center text-gray-700 hover:underline">
                    <x-heroicon-o-calendar-days class="w-4 h-4 mr-1 text-gray-500" />
                    Moje rezerwacje
                </a>
                <a href="{{ route('appointments.calendar') }}" class="flex items-center text-gray-700 hover:underline">
                    <x-heroicon-o-calendar class="w-4 h-4 mr-1 text-gray-500" />
                    Kalendarz
                </a>
                <a href="{{ route('messages.index') }}" class="flex items-center text-gray-700 hover:underline">
                    <x-heroicon-o-chat-bubble-left class="w-4 h-4 mr-1 text-gray-500" />
                    Wiadomości
                    @if($unreadMessages > 0)
                        <span class="ml-1 bg-red-500 text-white rounded-full px-2 text-xs">{{ $unreadMessages }}</span>
                    @endif
                </a>
            @endif
        </div>
        @endauth
    </div>
</nav>
