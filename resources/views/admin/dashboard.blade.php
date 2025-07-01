<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Dashboard') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                <div class="bg-white p-6 rounded-lg shadow">
                    <p class="text-sm text-gray-500">Najbliższa wizyta</p>
                    @if($nextAppointment)
                        <p class="mt-2 font-semibold">
                            {{ $nextAppointment->appointment_at->format('d.m.Y H:i') }}
                        </p>
                        <p class="text-xs text-gray-600">
                            {{ $nextAppointment->user->name }} - {{ $nextAppointment->serviceVariant->service->name }}
                        </p>
                    @else
                        <p class="mt-2 text-gray-400 italic">Brak zaplanowanych wizyt</p>
                    @endif
                </div>
                <div class="bg-white p-6 rounded-lg shadow">
                    <p class="text-sm text-gray-500">Nadchodzące wizyty</p>
                    <p class="mt-2 text-2xl font-bold">{{ $upcomingCount }}</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow">
                    <p class="text-sm text-gray-500">Oczekuje potwierdzenia</p>
                    <p class="mt-2 text-2xl font-bold">{{ $pendingCount }}</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow">
                    <p class="text-sm text-gray-500">Nieprzeczytane wiadomości</p>
                    <p class="mt-2 text-2xl font-bold">{{ $unreadMessages }}</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow">
                    <p class="text-sm text-gray-500">Użytkownicy</p>
                    <p class="mt-2 text-2xl font-bold">{{ $userCount }}</p>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
