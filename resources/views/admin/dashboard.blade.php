<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Dashboard') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
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
