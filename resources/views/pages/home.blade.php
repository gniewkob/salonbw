<x-guest-layout>
    @push('head')
        <title>Salon Black&White – Profesjonalna pielęgnacja włosów</title>
        <meta name="description" content="Nowoczesny salon fryzjerski w centrum miasta. Umów wizytę online i zadbaj o swoje włosy." />
        <meta property="og:title" content="Salon Black&White" />
        <meta property="og:description" content="Profesjonalna pielęgnacja i stylizacja włosów." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="{{ url('/') }}" />
        <meta property="og:image" content="{{ asset('img/slider/slider1.jpg') }}" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "HairSalon",
            "name": "Salon Black&White",
            "image": "{{ asset('img/slider/slider1.jpg') }}",
            "url": "{{ url('/') }}",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "Przykładowa 1",
                "addressLocality": "Miasto",
                "postalCode": "00-000",
                "addressCountry": "PL"
            }
        }
        </script>
    @endpush

    <!-- Hero Slider -->
    <section class="mb-10">
        <div class="hero-swiper relative overflow-hidden rounded-lg shadow-lg">
            <div class="swiper-wrapper">
                @foreach(['slider1.jpg', 'slider2.jpg', 'slider3.jpg'] as $slide)
                <div class="swiper-slide">
                    <img src="{{ asset('img/slider/'.$slide) }}" alt="Salon Black&White" class="w-full h-96 object-cover">
                    <div class="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-30">
                        <div class="text-center text-white px-4">
                            <h2 class="text-3xl font-bold mb-2">Witamy w Akademii Zdrowych Włosów <span class="text-black bg-white px-2">Black</span> & <span class="bg-black text-white px-2">White</span></h2>
                            <p class="max-w-xl mx-auto">Naszym celem jest dostarczanie najwyższej jakości usług i zadowolenia klienta. Rozumiemy indywidualne potrzeby każdego.</p>
                        </div>
                    </div>
                </div>
                @endforeach
            </div>
            <div class="swiper-pagination"></div>
        </div>
    </section>

    <section class="py-16 bg-gray-50">
        <div class="max-w-5xl mx-auto px-4 text-center">
            <h2 class="text-3xl font-bold mb-4">Witamy w Salon Black&White</h2>
            <p class="text-gray-700 mb-6">Naszą pasją jest dbanie o Twoje włosy i dobre samopoczucie. Poznaj nasz zespół doświadczonych specjalistów.</p>
        </div>
    </section>

    @php
        $servicePreview = \App\Models\Service::take(3)->get();
    @endphp
    <section class="py-16">
        <div class="max-w-7xl mx-auto px-4">
            <h2 class="text-3xl font-bold text-center mb-8">Popularne usługi</h2>
            <div class="grid md:grid-cols-3 gap-6">
                @forelse($servicePreview as $service)
                    <div class="bg-white shadow rounded-lg p-6 text-center">
                        <h3 class="font-semibold text-lg mb-2">{{ $service->name }}</h3>
                        <p class="text-sm text-gray-500 mb-4">Profesjonalna usługa dopasowana do Twoich potrzeb.</p>
                        <a href="{{ route('uslugi') }}" class="text-indigo-600 hover:underline">Zobacz więcej</a>
                    </div>
                @empty
                    <p class="col-span-3 text-center text-gray-500">Brak usług do wyświetlenia.</p>
                @endforelse
            </div>
        </div>
    </section>


    <section class="py-16">
        <div class="max-w-7xl mx-auto px-4">
            <h2 class="text-3xl font-bold text-center mb-8">Galeria</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                @forelse($instagramPhotos ?? [] as $photo)
                    <a href="{{ $photo['permalink'] }}" target="_blank">
                        @if(($photo['media_type'] ?? '') === 'VIDEO')
                            <video autoplay poster="{{ $photo['thumbnail_url'] ?? '' }}" class="w-full h-48 object-cover rounded" preload="none">
                                <source src="{{ $photo['media_url'] }}" type="video/mp4">
                                <img src="{{ $photo['thumbnail_url'] ?? '' }}" alt="{{ $photo['caption'] ?? '' }}" class="w-full h-48 object-cover rounded">
                            </video>
                        @else
                            <img src="{{ $photo['media_url'] }}" alt="{{ $photo['caption'] ?? '' }}" class="w-full h-48 object-cover rounded" loading="lazy">
                        @endif
                    </a>
                @empty
                    <p class="col-span-3 text-center text-gray-500">Zdjęcia wkrótce.</p>
                @endforelse
            </div>
            <div class="text-center mt-8">
                <a href="{{ route('gallery') }}" class="text-indigo-600 hover:underline">Zobacz więcej zdjęć</a>
            </div>
        </div>
    </section>

    <section class="py-16 bg-gray-50">
        <div class="max-w-3xl mx-auto px-4 text-center">
            <h2 class="text-3xl font-bold mb-6">Opinie klientów</h2>
            <div class="swiper testimonial-swiper">
                <div class="swiper-wrapper">
                    @foreach(['Fantastyczna obsługa!', 'Polecam w 100%', 'Najlepszy salon w mieście'] as $review)
                        <div class="swiper-slide p-6">
                            <p class="italic">"{{ $review }}"</p>
                        </div>
                    @endforeach
                </div>
                <div class="swiper-pagination"></div>
            </div>
        </div>
    </section>

    <section class="py-16">
        <div class="max-w-7xl mx-auto px-4 text-center">
            <h2 class="text-3xl font-bold mb-4">Zarezerwuj wizytę już dziś!</h2>
            <p class="mb-6">Rezerwacje online dostępne 24/7.</p>
            <a href="{{ route('reservation.entry') }}" class="bg-indigo-600 text-white px-6 py-3 rounded shadow hover:bg-indigo-700 transition">Umów wizytę</a>
        </div>
    </section>

    <section class="py-16 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4">
            <h2 class="text-3xl font-bold text-center mb-8">Najczęstsze pytania</h2>
            <div class="space-y-4" x-data="{selected:null}">
                @foreach(['Jak umówić wizytę?', 'Czy można odwołać rezerwację?', 'Jak przygotować się do wizyty?'] as $idx => $question)
                    <div class="border rounded-lg overflow-hidden">
                        <button class="w-full px-4 py-3 text-left font-medium bg-white" @click="selected === {{ $idx }} ? selected = null : selected = {{ $idx }}">
                            {{ $question }}
                        </button>
                        <div x-show="selected === {{ $idx }}" class="px-4 py-3 text-gray-700 bg-gray-50">
                            Odpowiedź przykładowa na pytanie.
                        </div>
                    </div>
                @endforeach
            </div>
            <div class="text-center mt-8">
                <a href="{{ route('faq') }}" class="text-indigo-600 hover:underline">Więcej pytań</a>
            </div>
        </div>
    </section>

    @php
        $mondayHours = $contactInfo->working_hours['monday'] ?? null;
    @endphp
    <section class="py-16">
        <div class="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-8">
            <div>
                <h2 class="text-3xl font-bold mb-4">Kontakt</h2>
                <p class="mb-2">{{ $contactInfo->address_line1 }}</p>
                @if($contactInfo->address_line2)
                    <p class="mb-2">{{ $contactInfo->address_line2 }}</p>
                @endif
                <p class="mb-2">{{ $contactInfo->postal_code }} {{ $contactInfo->city }}</p>
                <p class="mb-2">Tel: <a href="tel:{{ $contactInfo->phone }}" class="text-indigo-600 hover:underline">{{ $contactInfo->phone }}</a></p>
                @if($mondayHours && is_array($mondayHours))
                    <p class="mb-2">Godziny otwarcia: {{ $mondayHours[0] }}-{{ $mondayHours[1] }}</p>
                @endif
                <a href="{{ route('kontakt') }}" class="text-indigo-600 hover:underline">Więcej informacji</a>
            </div>
            <div>
                <div id="map" class="w-full h-64 rounded"></div>
            </div>
        </div>
    </section>

    @push('scripts')
        <script>
            document.addEventListener('DOMContentLoaded', function () {
                const lat = {{ $contactInfo->latitude ?? 'null' }};
                const lng = {{ $contactInfo->longitude ?? 'null' }};
                if (lat && lng) {
                    window.initMap(lat, lng, @json($contactInfo->address_line1));
                }
            });
        </script>
    @endpush
</x-guest-layout>
