<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
	public function index()
	{
		$users = User::orderBy('created_at', 'desc')->paginate(20);
		return view('admin.users.index', compact('users'));
	}

	public function edit($id)
	{
		$user = User::findOrFail($id);
		return view('admin.users.edit', compact('user'));
	}

	public function update(Request $request, $id)
	{
		$user = User::findOrFail($id);

		// Nie pozwól adminowi zmienić własnej roli na 'user', jeśli jest ostatnim adminem!
		if ($user->id === auth()->id() && $request->role !== 'admin') {
			return redirect()->back()->with('error', 'Nie możesz odebrać sobie uprawnień administratora!');
		}

		$request->validate([
			'role' => 'required|in:user,admin',
		]);

		$user->role = $request->role;
		$user->save();

		return redirect()->route('admin.users.index')->with('success', 'Rola użytkownika została zaktualizowana.');
	}
}
