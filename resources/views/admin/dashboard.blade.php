<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Dashboard') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div class="bg-white p-6 rounded-lg shadow">
                    <p class="text-sm text-gray-500">Nieprzeczytane wiadomości</p>
                    <p class="mt-2 text-2xl font-bold">{{ $unreadMessages }}</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow">
                    <p class="text-sm text-gray-500">Użytkownicy</p>
                    <p class="mt-2 text-2xl font-bold">{{ $userCount }}</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow">
                    <p class="text-sm text-gray-500">Najbliższe wizyty</p>
                    @forelse($upcomingAppointments as $appointment)
                        <div class="mt-2">
                            <p class="font-semibold">
                                {{ $appointment->appointment_at->format('d.m.Y H:i') }}
                                – {{ $appointment->user->name }}
                            </p>
                            @if($appointment->has_missed)
                                <p class="text-xs text-red-600">Klient ma nieodbyte wizyty</p>
                            @endif
                        </div>
                    @empty
                        <p class="mt-2 text-gray-400 italic">Brak zaplanowanych wizyt</p>
                    @endforelse
                </div>
                <div class="bg-white p-6 rounded-lg shadow">
                    <p class="text-sm text-gray-500">Statystyka miesiąca</p>
                    <p class="mt-2 text-sm">Odbyte: {{ $completedThisMonth }}</p>
                    <p class="text-xs text-gray-600">Poprzedni miesiąc: {{ $completedLastMonth }}, rok temu: {{ $completedLastYear }}</p>
                    <p class="mt-2 text-sm">Nieodbyte: {{ $missedThisMonth }}</p>
                    <p class="text-xs text-gray-600">Poprzedni miesiąc: {{ $missedLastMonth }}, rok temu: {{ $missedLastYear }}</p>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
