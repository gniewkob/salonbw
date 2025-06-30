<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">Dodaj kupon</h2>
    </x-slot>

    <div class="max-w-md mx-auto py-8">
        @if ($errors->any())
            <div class="bg-red-100 text-red-700 px-4 py-3 rounded mb-6">
                <ul class="list-disc list-inside">
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form method="POST" action="{{ route('admin.coupons.store') }}">
            @csrf
            <div class="mb-4">
                <label class="block font-medium">Kod</label>
                <input type="text" name="code" class="w-full border rounded px-4 py-2" value="{{ old('code') }}" required>
            </div>
            <div class="mb-4">
                <label class="block font-medium">Rabat (%)</label>
                <input type="number" name="discount_percent" class="w-full border rounded px-4 py-2" min="0" max="100" value="{{ old('discount_percent') }}" required>
            </div>
            <div class="mb-4">
                <label class="block font-medium">Data wygaśnięcia</label>
                <input type="datetime-local" name="expires_at" class="w-full border rounded px-4 py-2" value="{{ old('expires_at') }}">
            </div>
            <div class="mb-6">
                <label class="block font-medium">Limit użyć</label>
                <input type="number" name="usage_limit" class="w-full border rounded px-4 py-2" value="{{ old('usage_limit') }}">
            </div>
            <div>
                <button type="submit" class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Zapisz</button>
            </div>
        </form>
    </div>
</x-app-layout>
