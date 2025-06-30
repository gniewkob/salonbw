<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">Kupony rabatowe</h2>
    </x-slot>

    <div class="max-w-4xl mx-auto py-8">
        @if (session('success'))
            <div class="bg-green-100 text-green-700 px-4 py-2 rounded mb-4">
                {{ session('success') }}
            </div>
        @endif

        <a href="{{ route('admin.coupons.create') }}" class="mb-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ Dodaj kupon</a>

        <table class="w-full table-auto border-collapse bg-white shadow rounded">
            <thead>
                <tr class="bg-gray-100 border-b">
                    <th class="text-left p-3">Kod</th>
                    <th class="text-left p-3">Rabat</th>
                    <th class="text-left p-3">Zużycie</th>
                    <th class="text-left p-3">Akcje</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($coupons as $coupon)
                    <tr class="border-t hover:bg-gray-50">
                        <td class="p-3 font-medium text-gray-900">{{ $coupon->code }}</td>
                        <td class="p-3">{{ $coupon->discount_percent }}%</td>
                        <td class="p-3">{{ $coupon->used_count }}@if($coupon->usage_limit)/ {{ $coupon->usage_limit }}@endif</td>
                        <td class="p-3 space-x-2">
                            <a href="{{ route('admin.coupons.edit', $coupon) }}" class="text-blue-600 hover:underline">Edytuj</a>
                            <form action="{{ route('admin.coupons.destroy', $coupon) }}" method="POST" class="inline-block" onsubmit="return confirm('Na pewno usunąć?')">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="text-red-600 hover:underline">Usuń</button>
                            </form>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4" class="p-4 text-center text-gray-500">Brak kuponów.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</x-app-layout>
