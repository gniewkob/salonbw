<?php

namespace App\Http\Controllers;

use App\Models\Service;

class FrontendServiceController extends Controller
{
	public function index()
	{
		$services = Service::with('variants')->orderBy('name')->get();
		return view('pages.uslugi', compact('services'));
	}
}