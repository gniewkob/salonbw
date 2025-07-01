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
                    <p class="text-sm text-gray-500">Najbliższa wizyta</p>
                    @if($nextAppointment)
                        <a href="{{ route('admin.calendar', ['jump' => $nextAppointment->id]) }}" class="block hover:underline">
                            <p class="mt-2 font-semibold">
                                {{ $nextAppointment->appointment_at->format('d.m.Y H:i') }}
                            </p>
                            <p class="text-xs text-gray-600 capitalize">{{ $nextAppointment->status }}</p>
                        </a>
                    @else
                        <p class="mt-2 text-gray-400 italic">Brak zaplanowanych wizyt</p>
                    @endif
                </div>
                <div class="bg-white p-6 rounded-lg shadow">
                    <p class="text-sm text-gray-500">Odbyte wizyty</p>
                    <p class="mt-2 text-2xl font-bold">{{ $pastCount }}</p>
                    <p class="text-sm text-gray-500 mt-1">Nieodbyte: {{ $missedCount }}</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow">
                    <p class="text-sm text-gray-500">Oczekuje potwierdzenia</p>
                    <p class="mt-2 text-2xl font-bold">
                        <a href="{{ $pendingUrl }}" class="hover:underline">{{ $pendingCount }}</a>
                    </p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow">
                    <p class="text-sm text-gray-500">Nieprzeczytane wiadomości</p>
                    <p class="mt-2 text-2xl font-bold">
                        <a href="{{ $messagesUrl }}" class="hover:underline">{{ $unreadMessages }}</a>
                    </p>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
