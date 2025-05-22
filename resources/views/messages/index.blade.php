{{-- resources/views/messages/index.blade.php --}}
<x-app-layout>
    <h2 class="text-2xl font-bold mb-6">Moje wiadomości</h2>
    @foreach($messages as $msg)
        <div class="mb-4 border-b pb-2">
            <a href="{{ route('messages.show', $msg->id) }}" class="text-lg font-semibold">
                {{ Str::limit($msg->content, 60) }}
            </a>
            <div class="text-xs text-gray-500">Status: {{ $msg->is_from_admin ? 'Odpowiedź z salonu' : 'Twoja wiadomość' }}</div>
        </div>
    @endforeach
</x-app-layout>
