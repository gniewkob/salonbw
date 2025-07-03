{{-- resources/views/admin/messages/index.blade.php --}}
<x-app-layout>
    <div class="max-w-2xl mx-auto py-12">
        <h2 class="text-2xl font-bold mb-6">Wiadomości od klientów</h2>
        @foreach($messages as $msg)
            <a href="{{ route('admin.messages.show', $msg->id) }}" class="block bg-white p-4 rounded-lg shadow mb-4 hover:bg-gray-50">
                <div class="flex items-start justify-between">
                    <span class="font-semibold">
                        {{ optional($msg->user)->name ?? $msg->name }}: {{ Str::limit($msg->message, 60) }}
                    </span>
                    <span class="text-xs text-gray-500">{{ $msg->created_at->diffForHumans() }}</span>
                </div>
                @php
                    $last = $msg->replies->sortByDesc('created_at')->first();
                @endphp
                @if(!$last || !$last->is_from_admin)
                    <div class="text-red-600 text-xs mt-1">Wymaga odpowiedzi</div>
                @else
                    <div class="text-xs mt-1 {{ $last->is_read ? 'text-green-600' : 'text-yellow-600' }}">
                        {{ $last->is_read ? 'Odczytana przez użytkownika' : 'Nieodczytana przez użytkownika' }}
                    </div>
                @endif
            </a>
        @endforeach
        <div class="mt-6">
            {{ $messages->links() }}
        </div>
    </div>
</x-app-layout>
