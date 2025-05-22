<x-app-layout>
    <div class="max-w-lg mx-auto py-12">
        <h2 class="text-2xl font-bold mb-6">Nowa wiadomość do salonu</h2>
        @if(session('success'))
            <div class="mb-4 text-green-700">{{ session('success') }}</div>
        @endif

        <form action="{{ route('messages.store') }}" method="POST" class="space-y-6">
            @csrf
            <div>
                <label for="message" class="block font-semibold mb-2">Twoja wiadomość:</label>
                <textarea name="message" id="message" rows="5" class="w-full border rounded p-2" required>{{ old('message') }}</textarea>
                @error('message') <div class="text-red-600 text-sm mt-1">{{ $message }}</div> @enderror
            </div>
            <div>
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded">
                    Wyślij wiadomość
                </button>
                <a href="{{ route('messages.index') }}" class="ml-4 text-gray-600 hover:underline">Wróć do wiadomości</a>
            </div>
        </form>
    </div>
</x-app-layout>
