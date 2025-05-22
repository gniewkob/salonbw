<x-app-layout>
    <div class="max-w-2xl mx-auto py-12">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold">Moje wiadomości</h2>
            <a href="{{ route('messages.create') }}" class="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded shadow">
                Napisz nową wiadomość
            </a>
        </div>
        @if(session('success'))
            <div class="mb-4 text-green-700">{{ session('success') }}</div>
        @endif

        @forelse($messages as $msg)
            <div class="mb-4 border-b pb-2">
                <a href="{{ route('messages.show', $msg->id) }}" class="text-lg font-semibold">
                    {{ Str::limit($msg->message, 60) }}
                </a>
                <div class="text-xs text-gray-500">{{ $msg->created_at->diffForHumans() }}</div>
                @if($msg->replies->count())
                    <span class="text-green-600 text-xs ml-2">Odpowiedź z salonu</span>
                @endif
            </div>
        @empty
            <div class="text-gray-400 italic py-6">Nie masz jeszcze żadnych wiadomości.</div>
        @endforelse
    </div>
</x-app-layout>
