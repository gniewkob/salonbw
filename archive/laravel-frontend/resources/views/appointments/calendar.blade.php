<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl leading-tight">
            Mój kalendarz wizyt
        </h2>
    </x-slot>

    <div class="py-6 max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div id="calendar" data-events-url="{{ route('appointments.calendar.api') }}" class="bg-white shadow rounded-lg p-4"></div>
    </div>

    @push('scripts')
        @vite('resources/js/userAppointmentsCalendar.js')
    @endpush
</x-app-layout>
