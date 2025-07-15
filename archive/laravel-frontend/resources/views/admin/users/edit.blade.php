<x-app-layout>
	<div class="max-w-md mx-auto py-8">
		<h2 class="text-xl font-bold mb-6">Edycja roli użytkownika</h2>
		<form method="POST" action="{{ route('admin.users.update', $user->id) }}">
			@csrf
			@method('PUT')
			<div class="mb-4">
				<label class="block font-medium mb-2">Imię i nazwisko:</label>
				<div class="p-2 bg-gray-100 rounded">{{ $user->name }}</div>
			</div>
			<div class="mb-4">
				<label class="block font-medium mb-2">Email:</label>
				<div class="p-2 bg-gray-100 rounded">{{ $user->email }}</div>
			</div>
			<div class="mb-4">
				<label for="role" class="block font-medium mb-2">Rola:</label>
				<select name="role" id="role" class="w-full p-2 border rounded">
					<option value="user" @selected($user->role === 'user')>user</option>
					<option value="admin" @selected($user->role === 'admin')>admin</option>
				</select>
			</div>
			<button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Zapisz</button>
		</form>
		<div class="mt-6">
			<a href="{{ route('admin.users.index') }}" class="text-blue-500 hover:underline">&larr; Powrót do listy</a>
		</div>
	</div>
</x-app-layout>
