<x-guest-layout>
<div class="max-w-5xl mx-auto py-8 px-4">
	<h1 class="text-3xl font-bold mb-6">Nasze Usługi</h1>

    @forelse ($services as $service)
        <div class="mb-8 border-b pb-6">
            <h3 class="text-xl font-bold mb-1">{{ $service->name }}</h3>
            <div class="text-gray-600 mb-2">{{ $service->description }}</div>
            <ul>
                @forelse ($service->variants as $variant)
                    <li class="mb-2 flex items-center justify-between">
                        <div>
                            <span class="font-semibold">{{ $variant->variant_name }}</span>
                            @if($variant->price)
                                <span class="text-gray-400 ml-2">{{ number_format($variant->price, 2) }} zł</span>
                            @endif
                        </div>
                        @auth
                            <a href="{{ route('appointments.create', ['variant_id' => $variant->id]) }}"
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">Zarezerwuj</a>
                        @else
                        <a href="{{ route('login', ['redirect' => route('appointments.create', ['variant_id' => $variant->id])]) }}"
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
                            Zaloguj się i zarezerwuj
                        </a>
                        <a href="{{ route('register', ['redirect' => route('appointments.create', ['variant_id' => $variant->id])]) }}"
                            class="ml-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm">
                            Zarejestruj się i zaloguj
                        </a>

                        @endauth
                    </li>
                @empty
                    <li class="text-gray-400 italic">Brak wariantów tej usługi.</li>
                @endforelse
            </ul>
        </div>
    @empty
        <div class="text-center text-gray-400 py-12">
            Brak dostępnych usług. Wróć później!
        </div>
    @endforelse
</div>
</x-guest-layout>
