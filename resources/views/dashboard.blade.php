<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Dashboard') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div class="p-6 text-gray-900 space-y-2">
                <p>Witaj, <strong>{{ Auth::user()->name }}</strong>!</p>
                <p>To jest Twoje centrum zarządzania. Wkrótce pojawią się tutaj:</p>
                <ul class="list-disc list-inside text-sm text-gray-700">
                    <li>Twoje rezerwacje</li>
                    <li>Lista dostępnych usług</li>
                    <li>Profil użytkownika</li>
                </ul>
            </div>
            </div>
        </div>
    </div>
</x-app-layout>
