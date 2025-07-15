<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ReservationEntryController extends Controller
{
	public function index(Request $request)
	{
		$variantId = $request->query('variant_id');
		if (auth()->check()) {
			return redirect()->route('appointments.create', ['variant_id' => $variantId]);
		}
		// Widok wyboru: logowanie czy rejestracja
		return view('reservation.entry', compact('variantId'));
	}
}
