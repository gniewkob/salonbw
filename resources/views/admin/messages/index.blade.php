{{-- resources/views/admin/messages/index.blade.php --}}
<x-app-layout>
    <h2 class="text-2xl font-bold mb-6">Wiadomości od klientów</h2>
    @foreach($messages as $msg)
        <div class="mb-4 border-b pb-2">
            <a href="{{ route('admin.messages.show', $msg->id) }}" class="text-lg font-semibold">
                {{ $msg->user->name }}: {{ Str::limit($msg->content, 60) }}
            </a>
            <div class="text-xs text-gray-500">{{ $msg->created_at->diffForHumans() }}</div>
        </div>
    @endforeach
</x-app-layout>
