<x-app-layout>
    <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div class="md:flex md:items-center md:justify-between mb-6">
            <div class="flex-1 min-w-0">
                <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                    Edycja danych kontaktowych
                </h2>
            </div>
        </div>

        @if(session('success'))
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span class="block sm:inline">{{ session('success') }}</span>
            </div>
        @endif

        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
            <form action="{{ route('admin.kontakt.update') }}" method="POST">
                @csrf
                @method('PUT')

                <div class="px-4 py-3 bg-gray-50 text-right sm:px-6 border-b">
                    <button type="submit" class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Zapisz zmiany
                    </button>
                </div>
                
                <div class="px-4 py-5 sm:p-6">
                    <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <!-- Nazwa salonu -->
                        <div class="sm:col-span-6">
                            <label for="salon_name" class="block text-sm font-medium text-gray-700">Nazwa salonu</label>
                            <div class="mt-1">
                                <input type="text" name="salon_name" id="salon_name" 
                                    value="{{ old('salon_name', $contactInfo->salon_name) }}" 
                                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                            </div>
                            @error('salon_name')
                                <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <!-- Adres - linia 1 -->
                        <div class="sm:col-span-6">
                            <label for="address_line1" class="block text-sm font-medium text-gray-700">Adres - linia 1</label>
                            <div class="mt-1">
                                <input type="text" name="address_line1" id="address_line1" 
                                    value="{{ old('address_line1', $contactInfo->address_line1) }}" 
                                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                            </div>
                            @error('address_line1')
                                <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <!-- Adres - linia 2 -->
                        <div class="sm:col-span-6">
                            <label for="address_line2" class="block text-sm font-medium text-gray-700">Adres - linia 2 (opcjonalnie)</label>
                            <div class="mt-1">
                                <input type="text" name="address_line2" id="address_line2" 
                                    value="{{ old('address_line2', $contactInfo->address_line2) }}" 
                                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                            </div>
                            @error('address_line2')
                                <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <!-- Miasto -->
                        <div class="sm:col-span-3">
                            <label for="city" class="block text-sm font-medium text-gray-700">Miasto</label>
                            <div class="mt-1">
                                <input type="text" name="city" id="city" 
                                    value="{{ old('city', $contactInfo->city) }}" 
                                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                            </div>
                            @error('city')
                                <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <!-- Kod pocztowy -->
                        <div class="sm:col-span-3">
                            <label for="postal_code" class="block text-sm font-medium text-gray-700">Kod pocztowy</label>
                            <div class="mt-1">
                                <input type="text" name="postal_code" id="postal_code" 
                                    value="{{ old('postal_code', $contactInfo->postal_code) }}" 
                                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                            </div>
                            @error('postal_code')
                                <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <!-- Telefon -->
                        <div class="sm:col-span-3">
                            <label for="phone" class="block text-sm font-medium text-gray-700">Telefon</label>
                            <div class="mt-1">
                                <input type="text" name="phone" id="phone" 
                                    value="{{ old('phone', $contactInfo->phone) }}" 
                                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                            </div>
                            @error('phone')
                                <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <!-- Email -->
                        <div class="sm:col-span-3">
                            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                            <div class="mt-1">
                                <input type="email" name="email" id="email" 
                                    value="{{ old('email', $contactInfo->email) }}" 
                                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                            </div>
                            @error('email')
                                <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <!-- Opis -->
                        <div class="sm:col-span-6">
                            <label for="description" class="block text-sm font-medium text-gray-700">Opis</label>
                            <div class="mt-1">
                                <textarea name="description" id="description" rows="3" 
                                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">{{ old('description', $contactInfo->description) }}</textarea>
                            </div>
                            @error('description')
                                <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <!-- Godziny pracy - nagłówek -->
                        <div class="sm:col-span-6">
                            <h3 class="text-lg font-medium leading-6 text-gray-900 mt-4">Godziny pracy</h3>
                            <p class="mt-1 text-sm text-gray-500">Ustaw godziny pracy dla każdego dnia tygodnia. Pozostaw puste dla dni wolnych.</p>
                        </div>

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
                            $workingHours = old('working_hours', $contactInfo->working_hours ?? []);
                        @endphp

                        @foreach($days as $dayKey => $dayName)
                            <div class="sm:col-span-6">
                                <label class="block text-sm font-medium text-gray-700">{{ $dayName }}</label>
                                <div class="mt-1 flex items-center space-x-2">
                                    <input type="time" name="working_hours[{{ $dayKey }}][]" 
                                        value="{{ isset($workingHours[$dayKey][0]) ? $workingHours[$dayKey][0] : '' }}" 
                                        class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md">
                                    <span>do</span>
                                    <input type="time" name="working_hours[{{ $dayKey }}][]" 
                                        value="{{ isset($workingHours[$dayKey][1]) ? $workingHours[$dayKey][1] : '' }}" 
                                        class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md">
                                </div>
                                @error("working_hours.$dayKey.0")
                                    <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                                @enderror
                                @error("working_hours.$dayKey.1")
                                    <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                                @enderror
                            </div>
                        @endforeach

                        <!-- Media społecznościowe - nagłówek -->
                        <div class="sm:col-span-6">
                            <h3 class="text-lg font-medium leading-6 text-gray-900 mt-4">Media społecznościowe</h3>
                        </div>

                        <!-- Facebook URL -->
                        <div class="sm:col-span-6">
                            <label for="facebook_url" class="block text-sm font-medium text-gray-700">Facebook URL</label>
                            <div class="mt-1">
                                <input type="url" name="facebook_url" id="facebook_url" 
                                    value="{{ old('facebook_url', $contactInfo->facebook_url) }}" 
                                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                            </div>
                            @error('facebook_url')
                                <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <!-- Instagram URL -->
                        <div class="sm:col-span-6">
                            <label for="instagram_url" class="block text-sm font-medium text-gray-700">Instagram URL</label>
                            <div class="mt-1">
                                <input type="url" name="instagram_url" id="instagram_url" 
                                    value="{{ old('instagram_url', $contactInfo->instagram_url) }}" 
                                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                            </div>
                            @error('instagram_url')
                                <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <!-- Google Maps URL -->
                        <div class="sm:col-span-6">
                            <label for="google_maps_url" class="block text-sm font-medium text-gray-700">Google Maps URL</label>
                            <div class="mt-1">
                                <input type="url" name="google_maps_url" id="google_maps_url"
                                    value="{{ old('google_maps_url', $contactInfo->google_maps_url) }}"
                                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                            </div>
                            @error('google_maps_url')
                                <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <!-- Latitude -->
                        <div class="sm:col-span-3">
                            <label for="latitude" class="block text-sm font-medium text-gray-700">Szerokość (lat)</label>
                            <div class="mt-1">
                                <input type="text" name="latitude" id="latitude"
                                    value="{{ old('latitude', $contactInfo->latitude) }}"
                                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                            </div>
                            @error('latitude')
                                <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <!-- Longitude -->
                        <div class="sm:col-span-3">
                            <label for="longitude" class="block text-sm font-medium text-gray-700">Długość (lng)</label>
                            <div class="mt-1">
                                <input type="text" name="longitude" id="longitude"
                                    value="{{ old('longitude', $contactInfo->longitude) }}"
                                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                            </div>
                            @error('longitude')
                                <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                            @enderror
                        </div>
                    </div>
                </div>

                <div class="px-4 py-3 bg-gray-50 text-right sm:px-6">
                    <button type="submit" class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Zapisz zmiany
                    </button>
                </div>
            </form>
        </div>
    </div>
</x-app-layout>
