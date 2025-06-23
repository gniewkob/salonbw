<x-guest-layout>
	<h1 class="text-3xl font-bold mb-6 text-center">Skontaktuj się z nami</h1>

	<div class="max-w-4xl mx-auto space-y-6 text-center">
		<p class="text-lg">
			📍 <strong>Adres:</strong><br>
			ul. Stefana Webera 1a<br>
			41-902 Bytom
		</p>

		<p class="text-lg">
			📞 <strong>Telefon:</strong><br>
			<a href="tel:+48723588868" class="text-blue-600 hover:underline">+48 723 588 868</a>
		</p>

		<p class="text-lg">
			📧 <strong>E-mail:</strong><br>
			<a href="mailto:kontakt@salon-bw.pl" class="text-blue-600 hover:underline">kontakt@salon-bw.pl</a>
		</p>

		<p class="text-lg text-center">
			💬 <strong>WhatsApp:</strong><br>
			<a href="https://wa.me/48723588868" target="_blank" class="text-green-600 hover:underline">
				Napisz do nas na WhatsApp
			</a>
		</p>




		<div class="pt-4">
			<h2 class="text-xl font-semibold mb-2">Jak do nas trafić?</h2>
			<div class="aspect-w-16 aspect-h-9">
				<iframe class="w-full h-80 rounded-lg shadow"
					loading="lazy"
					allowfullscreen
					referrerpolicy="no-referrer-when-downgrade"
					src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2563.0658784063153!2d18.91093751598082!3d50.34623847946937!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47113061f0f77f11%3A0x39e236ec244bcabb!2sBytom!5e0!3m2!1spl!2spl!4v1618312782107!5m2!1spl!2spl">
				</iframe>
			</div>
		</div>
		@if(session('success'))
			<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 text-center">
				{{ session('success') }}
			</div>
		@endif
		
		@if ($errors->any())
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-left max-w-xl mx-auto">
				<ul class="list-disc list-inside">
					@foreach ($errors->all() as $error)
						<li>{{ $error }}</li>
					@endforeach
				</ul>
			</div>
		@endif
		
                <form action="{{ route('kontakt.store') }}" method="POST" class="max-w-xl mx-auto space-y-4 text-left">
			@csrf
			<div>
				<label for="name" class="block font-medium">Imię i nazwisko:</label>
				<input type="text" id="name" name="name" value="{{ old('name') }}"
					class="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500">
			</div>
			<div>
				<label for="email" class="block font-medium">Adres e-mail:</label>
				<input type="email" id="email" name="email" value="{{ old('email') }}"
					class="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500">
			</div>
			<div>
				<label for="phone" class="block font-medium">Telefon:</label>
				<input type="text" id="phone" name="phone" value="{{ old('phone') }}"
					class="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500">
			</div>
			<div>
				<label for="message" class="block font-medium">Wiadomość:</label>
				<textarea id="message" name="message" rows="5"
					class="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500">{{ old('message') }}</textarea>
			</div>
			<div style="display:none;">
				<label for="website">Zostaw to pole puste</label>
				<input type="text" name="website" id="website" value="">
			</div>
                        <div class="my-4">
                                <div class="h-captcha" data-sitekey="{{ env('HCAPTCHA_SITEKEY') }}"></div>
                        </div>
			<button type="submit"
				class="bg-gray-900 text-white px-6 py-2 rounded hover:bg-gray-700 transition w-full">
				Wyślij wiadomość
			</button>
		</form>
	</div>
<script src="https://hcaptcha.com/1/api.js" async defer></script>
</x-guest-layout>
