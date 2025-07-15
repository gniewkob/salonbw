<x-app-layout>
	<div class="max-w-4xl mx-auto py-8">
		<h2 class="text-2xl font-bold mb-6">Użytkownicy systemu</h2>
		@if(session('success'))
			<div class="bg-green-100 text-green-800 p-2 mb-4 rounded">
				{{ session('success') }}
			</div>
		@endif
		@if(session('error'))
			<div class="bg-red-100 text-red-800 p-2 mb-4 rounded">
				{{ session('error') }}
			</div>
		@endif
		<table class="w-full table-auto border-collapse mb-6">
			<thead>
				<tr>
					<th class="p-2 border-b">ID</th>
					<th class="p-2 border-b">Imię i nazwisko</th>
					<th class="p-2 border-b">Email</th>
					<th class="p-2 border-b">Rola</th>
					<th class="p-2 border-b">Akcje</th>
				</tr>
			</thead>
			<tbody>
				@foreach($users as $user)
					<tr>
						<td class="p-2 border-b">{{ $user->id }}</td>
						<td class="p-2 border-b">{{ $user->name }}</td>
						<td class="p-2 border-b">{{ $user->email }}</td>
						<td class="p-2 border-b">
							<span @class([
								'px-2 py-1 rounded',
								'bg-blue-100 text-blue-800' => $user->role === 'admin',
								'bg-gray-100 text-gray-800' => $user->role === 'user'
							])>
								{{ $user->role }}
							</span>
						</td>
						<td class="p-2 border-b">
							@if(auth()->id() !== $user->id || $user->role !== 'admin')
								<a href="{{ route('admin.users.edit', $user->id) }}" class="text-blue-600 hover:underline">Edytuj rolę</a>
							@else
								<span class="text-gray-400">---</span>
							@endif
						</td>
					</tr>
				@endforeach
			</tbody>
		</table>
		{{ $users->links() }}
	</div>
</x-app-layout>
