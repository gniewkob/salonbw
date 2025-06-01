<x-app-layout>
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6 bg-white border-b border-gray-200">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Informacje kontaktowe -->
                        <div>
                            <h2 class="text-2xl font-bold mb-4">Kontakt</h2>
                            
                            @php
                                $contactInfo = \App\Models\ContactInfo::getDefault();
                            @endphp
                            
                            <div class="mb-4">
                                <h3 class="text-lg font-semibold">{{ $contactInfo->salon_name ?? 'Salon Beauty & Wellness' }}</h3>
                                <p>{{ $contactInfo->address_line1 }}</p>
                                @if($contactInfo->address_line2)
                                    <p>{{ $contactInfo->address_line2 }}</p>
                                @endif
                                <p>{{ $contactInfo->postal_code }} {{ $contactInfo->city }}</p>
                            </div>
                            
                            <div class="mb-4">
                                <p><strong>Telefon:</strong> <a href="tel:{{ $contactInfo->phone }}" class="text-indigo-600 hover:text-indigo-800">{{ $contactInfo->phone }}</a></p>
                                <p><strong>Email:</strong> <a href="mailto:{{ $contactInfo->email }}" class="text-indigo-600 hover:text-indigo-800">{{ $contactInfo->email }}</a></p>
                            </div>
                            
                            @if($contactInfo->description)
                                <div class="mb-4">
                                    <p>{{ $contactInfo->description }}</p>
                                </div>
                            @endif
                            
                            <!-- Godziny otwarcia -->
                            <div class="mb-4">
                                <h3 class="text-lg font-semibold mb-2">Godziny otwarcia</h3>
                                <table class="w-full">
                                    @php
                                        $days = [
                                            'monday' => 'Poniedziałek',
                                            'tuesday' => 'Wtorek',
                                            'wednesday' => 'Środa',
                                            'thursday' => 'Czwartek',
                                            'friday' => 'Piątek',
                                            'saturday' => 'Sobota',
                                            'sunday' => 'Niedziela',
                                        ];
                                        $workingHours = $contactInfo->working_hours ?? [];
                                    @endphp
                                    
                                    @foreach($days as $dayKey => $dayName)
                                        <tr>
                                            <td class="py-1 pr-4 font-medium">{{ $dayName }}</td>
                                            <td>
                                                @if(isset($workingHours[$dayKey]) && is_array($workingHours[$dayKey]) && count($workingHours[$dayKey]) == 2)
                                                    {{ $workingHours[$dayKey][0] }} - {{ $workingHours[$dayKey][1] }}
                                                @else
                                                    Zamknięte
                                                @endif
                                            </td>
                                        </tr>
                                    @endforeach
                                </table>
                            </div>
                            
                            <!-- Media społecznościowe -->
                            @if($contactInfo->facebook_url || $contactInfo->instagram_url)
                                <div class="mb-4">
                                    <h3 class="text-lg font-semibold mb-2">Znajdź nas</h3>
                                    <div class="flex space-x-4">
                                        @if($contactInfo->facebook_url)
                                            <a href="{{ $contactInfo->facebook_url }}" target="_blank" class="text-blue-600 hover:text-blue-800">
                                                <span class="sr-only">Facebook</span>
                                                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path fill-rule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clip-rule="evenodd" />
                                                </svg>
                                            </a>
                                        @endif
                                        @if($contactInfo->instagram_url)
                                            <a href="{{ $contactInfo->instagram_url }}" target="_blank" class="text-pink-600 hover:text-pink-800">
                                                <span class="sr-only">Instagram</span>
                                                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path fill-rule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clip-rule="evenodd" />
                                                </svg>
                                            </a>
                                        @endif
                                    </div>
                                </div>
                            @endif
                        </div>
                        
                        <!-- Formularz kontaktowy -->
                        <div>
                            <h2 class="text-2xl font-bold mb-4">Napisz do nas</h2>
                            
                            @if(session('success'))
                                <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                                    <span class="block sm:inline">{{ session('success') }}</span>
                                </div>
                            @endif
                            
                            <form action="{{ route('kontakt.store') }}" method="POST">
                                @csrf
                                <div class="mb-4">
                                    <label for="name" class="block text-sm font-medium text-gray-700">Imię i nazwisko</label>
                                    <input type="text" name="name" id="name" value="{{ old('name') }}" class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md">
                                    @error('name')
                                        <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                                    @enderror
                                </div>
                                
                                <div class="mb-4">
                                    <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                                    <input type="email" name="email" id="email" value="{{ old('email') }}" class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md">
                                    @error('email')
                                        <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                                    @enderror
                                </div>
                                
                                <div class="mb-4">
                                    <label for="phone" class="block text-sm font-medium text-gray-700">Telefon (opcjonalnie)</label>
                                    <input type="text" name="phone" id="phone" value="{{ old('phone') }}" class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md">
                                    @error('phone')
                                        <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                                    @enderror
                                </div>
                                
                                <div class="mb-4">
                                    <label for="message" class="block text-sm font-medium text-gray-700">Wiadomość</label>
                                    <textarea name="message" id="message" rows="4" class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md">{{ old('message') }}</textarea>
                                    @error('message')
                                        <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                                    @enderror
                                </div>
                                
                                <div>
                                    <button type="submit" class="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                        Wyślij wiadomość
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    
                    <!-- Mapa Google -->
                    @if($contactInfo->google_maps_url)
                        <div class="mt-8">
                            <h3 class="text-lg font-semibold mb-2">Jak do nas trafić</h3>
                            <div class="aspect-w-16 aspect-h-9">
                                <iframe src="{{ $contactInfo->google_maps_url }}" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                            </div>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
