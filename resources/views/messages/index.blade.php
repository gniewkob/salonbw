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
            @php
                $textColor = '';
                if (! $msg->is_read && $msg->is_from_admin) {
                    $textColor = 'text-red-600';
                } elseif ($msg->replies->where('is_from_admin', true)->isEmpty()) {
                    $textColor = 'text-orange-600';
                } elseif ($msg->replies->where('is_from_admin', true)->isNotEmpty() && $msg->is_read) {
                    $textColor = 'text-green-600';
                }
            @endphp
            <a href="{{ route('messages.show', $msg->id) }}" class="block bg-white p-4 rounded-lg shadow mb-4 hover:bg-gray-50 {{ $textColor }}">
                <div class="flex items-start justify-between">
                    <span class="font-semibold">{{ Str::limit($msg->message, 60) }}</span>
                    <span class="text-xs text-gray-500">{{ $msg->created_at->diffForHumans() }}</span>
                </div>
                @if($msg->replies->contains('is_from_admin', true))
                    <div class="text-green-600 text-xs mt-1">Odpowiedź z salonu</div>
                @endif
            </a>
        @empty
            <div class="text-gray-400 italic py-6">Nie masz jeszcze żadnych wiadomości.</div>
        @endforelse
    </div>
</x-app-layout>
