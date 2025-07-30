<?php

// app/Http/Middleware/IsAdmin.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;

class IsAdmin
{
	public function handle($request, Closure $next)
	{
		if (Auth::check() && Auth::user()->role === 'admin') {
			return $next($request);
		}
		abort(403, 'Brak dostępu');
	}
}
