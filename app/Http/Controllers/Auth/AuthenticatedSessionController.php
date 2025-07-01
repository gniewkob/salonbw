<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Providers\RouteServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\Auth\LoginRequest;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create()
    {
        return view('auth.login');
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request)
    {
        $request->authenticate();
        $request->session()->regenerate();

        // Bezpieczne przekierowanie jeśli podany redirect
        $redirect = $request->input('redirect');
        if ($redirect && filter_var($redirect, FILTER_VALIDATE_URL)) {
            $appUrl = config('app.url');
            if (str_starts_with($redirect, $appUrl)) {
                return redirect()->to($redirect);
            }
        }

        // Domyślne zachowanie z rozróżnieniem roli
        $home = auth()->user()->role === 'admin'
            ? route('admin.dashboard')
            : RouteServiceProvider::HOME;

        return redirect()->intended($home);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
