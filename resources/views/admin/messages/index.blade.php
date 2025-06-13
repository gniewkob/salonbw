{{-- resources/views/admin/messages/index.blade.php --}}
<x-app-layout>
    <div class="max-w-2xl mx-auto py-12">
        <h2 class="text-2xl font-bold mb-6">Wiadomości od klientów</h2>
        @foreach($messages as $msg)
            <a href="{{ route('admin.messages.show', $msg->id) }}" class="block bg-white p-4 rounded-lg shadow mb-4 hover:bg-gray-50">
                <div class="flex items-start justify-between">
                    <span class="font-semibold">{{ $msg->user->name }}: {{ Str::limit($msg->message, 60) }}</span>
                    <span class="text-xs text-gray-500">{{ $msg->created_at->diffForHumans() }}</span>
                </div>
            </a>
        @endforeach
    </div>
</x-app-layout>
