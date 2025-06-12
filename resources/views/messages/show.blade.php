<x-app-layout>
    <div class="max-w-2xl mx-auto py-12">
        <a href="{{ route('messages.index') }}" class="text-blue-600 hover:underline">
            ← Wróć do listy wiadomości
        </a>

        <div class="bg-white shadow p-4 rounded my-4">
            <div class="text-xs text-gray-500 mb-2">
                {{ $message->created_at->format('d.m.Y H:i') }}
            </div>
            <p>{{ $message->message }}</p>
        </div>

        @forelse ($message->replies as $reply)
            <div class="bg-gray-50 p-4 rounded mb-4">
                <div class="text-xs text-gray-500 mb-1">
                    {{ $reply->admin->name ?? 'Admin' }} —
                    {{ $reply->created_at->format('d.m.Y H:i') }}
                </div>
                <p>{{ $reply->message }}</p>
            </div>
        @empty
            <p class="text-gray-500 italic">Brak odpowiedzi.</p>
        @endforelse
    </div>
</x-app-layout>
