<x-app-layout>
    <x-slot name="header">
        <h2 class="text-xl font-semibold leading-tight">
            {{ __('Napisz wiadomość') }}
        </h2>
    </x-slot>

    <div class="py-8 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white shadow-md rounded-lg p-6">
            <form method="POST" action="{{ route('messages.store') }}">
                @csrf

                {{-- Dla niezalogowanych użytkowników --}}
                @guest
                    <div class="mb-4">
                        <label for="name" class="block font-medium text-sm text-gray-700">Imię i nazwisko</label>
                        <input id="name" type="text" name="name" value="{{ old('name') }}" required autofocus
                            class="mt-1 block w-full rounded-md shadow-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                        @error('name')<p class="text-sm text-red-600">{{ $message }}</p>@enderror
                    </div>

                    <div class="mb-4">
                        <label for="email" class="block font-medium text-sm text-gray-700">Email</label>
                        <input id="email" type="email" name="email" value="{{ old('email') }}" required
                            class="mt-1 block w-full rounded-md shadow-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                        @error('email')<p class="text-sm text-red-600">{{ $message }}</p>@enderror
                    </div>
                @endguest

                {{-- Telefon kontaktowy --}}
                <div class="mb-4">
                    <label for="phone" class="block font-medium text-sm text-gray-700">Telefon (opcjonalnie)</label>
                    <input id="phone" type="text" name="phone" value="{{ old('phone') }}"
                        class="mt-1 block w-full rounded-md shadow-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                    @error('phone')<p class="text-sm text-red-600">{{ $message }}</p>@enderror
                </div>

                {{-- Kategoria --}}
                <div class="mb-4">
                    <label for="category" class="block font-medium text-sm text-gray-700">Temat</label>
                    <select id="category" name="category"
                        class="mt-1 block w-full rounded-md shadow-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                        <option value="">-- wybierz temat --</option>
                        <option value="rezerwacja" {{ old('category') == 'rezerwacja' ? 'selected' : '' }}>Rezerwacja</option>
                        <option value="pytanie" {{ old('category') == 'pytanie' ? 'selected' : '' }}>Pytanie</option>
                        <option value="opinia" {{ old('category') == 'opinia' ? 'selected' : '' }}>Opinia</option>
                        <option value="inne" {{ old('category') == 'inne' ? 'selected' : '' }}>Inne</option>
                    </select>
                    @error('category')<p class="text-sm text-red-600">{{ $message }}</p>@enderror
                </div>

                {{-- Wiadomość --}}
                <div class="mb-4">
                    <label for="message" class="block font-medium text-sm text-gray-700">Wiadomość</label>
                    <textarea id="message" name="message" rows="6" required
                        class="mt-1 block w-full rounded-md shadow-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">{{ old('message') }}</textarea>
                    @error('message')<p class="text-sm text-red-600">{{ $message }}</p>@enderror
                </div>

                {{-- Przyciski --}}
                <div class="flex justify-end">
                    <button type="submit"
                        class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded shadow">
                        Wyślij wiadomość
                    </button>
                </div>
            </form>
        </div>
    </div>
</x-app-layout>
