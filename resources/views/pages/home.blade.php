<x-guest-layout>

	<!-- Hero Slider -->
	<section class="mb-10">
		<div class="relative overflow-hidden rounded-lg shadow-lg">
			<div class="flex flex-col md:flex-row">
				<div class="w-full">
					<img src="{{ asset('img/slider/slider1.jpg') }}" alt="Salon Black&White" class="w-full h-96 object-cover">
					<div class="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-30">
						<div class="text-center text-white px-4">
							<h2 class="text-3xl font-bold mb-2">Witamy w Akademii Zdrowych Włosów <span class="text-black bg-white px-2">Black</span> & <span class="bg-black text-white px-2">White</span></h2>
							<p class="max-w-xl mx-auto">Naszym celem jest dostarczanie najwyższej jakości usług i zadowolenia klienta. Rozumiemy indywidualne potrzeby każdego.</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Main Info -->
	<section class="text-center">
		<div class="max-w-4xl mx-auto">
			<h2 class="text-2xl font-bold mb-4">Nowoczesna Stylizacja</h2>
			<p class="mb-6">Różnorodność fryzur, zabiegów skóry głowy oraz usług kosmetycznych sprawia, że Salon Black&White stanie się Twoim miejscem piękna i relaksu.</p>

			<h2 class="text-2xl font-bold mb-4">Serdecznie Zapraszamy</h2>
			<p>Zapoznaj się z naszą <a href="{{ route('uslugi') }}" class="text-blue-600 underline">ofertą</a>. Masz pytania? <a href="{{ route('kontakt') }}" class="text-blue-600 underline">Skontaktuj się z nami</a>.</p>
		</div>
	</section>
</x-guest-layout>
