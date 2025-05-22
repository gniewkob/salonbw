<x-app-layout>
    <h2 class="text-2xl font-bold mb-6">Moje wiadomości</h2>
    @foreach($messages as $msg)
        <div class="mb-4 border-b pb-2">
            <a href="{{ route('messages.show', $msg->id) }}" class="text-lg font-semibold">
                {{ Str::limit($msg->message, 60) }}
            </a>
            <div class="text-xs text-gray-500">{{ $msg->created_at->diffForHumans() }}</div>
            @if($msg->replies->count())
                <span class="text-green-600 text-xs ml-2">Odpowiedź z salonu</span>
            @endif
        </div>
    @endforeach
</x-app-layout>
