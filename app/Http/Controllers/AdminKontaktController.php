<?php

namespace App\Http\Controllers;

use App\Models\KontaktMessage;

class AdminKontaktController extends Controller
{
	public function index()
	{
		// Pobierz wszystkie wiadomości kontaktowe, posortowane od najnowszych
		$messages = KontaktMessage::orderByDesc('created_at')->paginate(20);

		// Przekaż dane do widoku admin/kontakt/index.blade.php
		return view('admin.kontakt.index', compact('messages'));
	}
}
