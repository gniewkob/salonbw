<x-app-layout>
    <div class="max-w-2xl mx-auto py-12">
        <a href="{{ route('admin.messages.index') }}" class="text-blue-600 hover:underline">&larr; Wróć do listy</a>

        <div class="space-y-4 my-4">
            <div class="flex justify-start">
                <div class="bg-gray-200 text-gray-800 p-3 rounded-lg shadow max-w-xs">
                    <div class="text-xs text-gray-600 mb-1">
                        {{ $message->user->name ?? 'Klient' }} — {{ $message->created_at->format('d.m.Y H:i') }}
                    </div>
                    <p>{{ $message->message }}</p>
                </div>
            </div>

            @foreach ($message->replies as $reply)
                <div class="flex {{ $reply->is_from_admin ? 'justify-end' : 'justify-start' }}">
                    <div class="p-3 rounded-lg shadow max-w-xs {{ $reply->is_from_admin ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800' }}">
                        <div class="text-xs mb-1 {{ $reply->is_from_admin ? 'text-white/80' : 'text-gray-600' }}">
                            @if($reply->is_from_admin)
                                {{ $reply->admin->name ?? 'Admin' }}
                            @else
                                {{ $reply->user->name ?? 'Klient' }}
                            @endif
                            — {{ $reply->created_at->format('d.m.Y H:i') }}
                        </div>
                        <p>{{ $reply->message }}</p>
                    </div>
                </div>
            @endforeach
        </div>

        <form method="POST" action="{{ route('admin.messages.reply', $message->id) }}" class="mt-6">
            @csrf
            <textarea name="message" rows="4" required class="w-full rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"></textarea>
            @error('message')
                <p class="text-sm text-red-600">{{ $message }}</p>
            @enderror
            <div class="flex justify-end mt-2">
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow">Wyślij odpowiedź</button>
            </div>
        </form>
    </div>
</x-app-layout>
