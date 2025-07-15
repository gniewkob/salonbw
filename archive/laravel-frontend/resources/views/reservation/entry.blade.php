<x-guest-layout>
    <div class="max-w-md mx-auto py-16">
        <h2 class="text-xl font-bold mb-8 text-center">Rezerwacja wizyty</h2>
        <p class="mb-8 text-center text-gray-600">Aby kontynuować, wybierz jedną z opcji:</p>
        <div class="flex flex-col gap-6">
            <a href="{{ route('login', ['redirect' => route('appointments.create', ['variant_id' => $variantId])]) }}"
               class="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded text-lg font-semibold">
                Mam konto – Zaloguj się
            </a>
            <a href="{{ route('register', ['redirect' => route('appointments.create', ['variant_id' => $variantId])]) }}"
               class="block w-full bg-gray-600 hover:bg-gray-700 text-white text-center py-3 rounded text-lg font-semibold">
                Nie mam konta – Zarejestruj się
            </a>
        </div>
    </div>
</x-guest-layout>
