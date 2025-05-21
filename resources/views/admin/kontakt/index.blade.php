<x-app-layout>
	<div class="max-w-4xl mx-auto py-8">
		<h2 class="text-2xl font-bold mb-6">Wiadomości kontaktowe</h2>
		@if(session('success'))
			<div class="bg-green-100 text-green-800 p-2 mb-4 rounded">
				{{ session('success') }}
			</div>
		@endif

		<table class="w-full border border-gray-200">
			<thead>
				<tr>
					<th class="p-2 border-b">Data</th>
					<th class="p-2 border-b">Imię i nazwisko</th>
					<th class="p-2 border-b">Email</th>
					<th class="p-2 border-b">Telefon</th>
					<th class="p-2 border-b">Wiadomość</th>
				</tr>
			</thead>
			<tbody>
				@forelse($messages as $msg)
					<tr>
						<td class="p-2 border-b">{{ $msg->created_at->format('Y-m-d H:i') }}</td>
						<td class="p-2 border-b">{{ $msg->name }}</td>
						<td class="p-2 border-b">{{ $msg->email }}</td>
						<td class="p-2 border-b">{{ $msg->phone ?? '-' }}</td>
						<td class="p-2 border-b">{{ $msg->message }}</td>
					</tr>
				@empty
					<tr>
						<td colspan="5" class="p-2 text-center text-gray-400">Brak wiadomości.</td>
					</tr>
				@endforelse
			</tbody>
		</table>
	</div>
</x-app-layout>
