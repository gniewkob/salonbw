@extends('layouts.app')

@section('title', 'Wiadomości kontaktowe')

@section('content')
	<h1 class="text-2xl font-bold mb-6">Wiadomości z formularza kontaktowego</h1>

	<table class="w-full text-left border-collapse">
		<thead>
			<tr class="bg-gray-200">
				<th class="p-2">Imię i nazwisko</th>
				<th class="p-2">E-mail</th>
				<th class="p-2">Telefon</th>
				<th class="p-2">Wiadomość</th>
				<th class="p-2">Data</th>
			</tr>
		</thead>
		<tbody>
			@foreach($messages as $msg)
				<tr class="border-t">
					<td class="p-2">{{ $msg->name }}</td>
					<td class="p-2">{{ $msg->email }}</td>
					<td class="p-2">{{ $msg->phone ?? '—' }}</td>
					<td class="p-2">{{ $msg->message }}</td>
					<td class="p-2 text-sm text-gray-500">{{ $msg->created_at->format('Y-m-d H:i') }}</td>
				</tr>
			@endforeach
		</tbody>
	</table>

	<div class="mt-6">
		{{ $messages->links() }}
	</div>
@endsection
