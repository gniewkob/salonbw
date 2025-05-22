<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\KontaktMessage;
use Illuminate\Support\Facades\Auth;

class KontaktController extends Controller
{
    // Widok "Moje wiadomości" (dla zalogowanych)
    public function myMessages()
    {
        $messages = KontaktMessage::where('user_id', auth()->id())
            ->whereNull('reply_to_id')
            ->with('replies')
            ->orderByDesc('created_at')
            ->get();

        return view('messages.index', compact('messages'));
    }

    // Widok pojedynczej wiadomości (dla zalogowanych)
    public function show($id)
    {
        $message = KontaktMessage::with(['replies', 'replies.admin'])->findOrFail($id);
        abort_if($message->user_id !== auth()->id(), 403);

        return view('messages.show', compact('message'));
    }

    // Formularz nowej wiadomości (dla zalogowanych)
    public function create()
    {
        return view('messages.create');
    }

    // Zapis nowej wiadomości od użytkownika (zalogowany lub niezalogowany)
    public function store(Request $request)
    {
        if (auth()->check()) {
            // Dla zalogowanego użytkownika
            $request->validate([
                'message' => 'required|string|max:2000',
            ]);
            $msg = KontaktMessage::create([
                'message'    => $request->message,
                'user_id'    => auth()->id(),
                'is_from_admin' => false,
                'is_read'    => false,
            ]);
        } else {
            // Dla niezalogowanego
            $request->validate([
                'name'    => 'required|string|max:100',
                'email'   => 'required|email|max:255',
                'phone'   => 'nullable|string|max:30',
                'message' => 'required|string|max:2000',
            ]);
            $msg = KontaktMessage::create([
                'name'     => $request->name,
                'email'    => $request->email,
                'phone'    => $request->phone,
                'message'  => $request->message,
                'is_from_admin' => false,
                'is_read'  => false,
            ]);
        }

        // Możesz tu wywołać maila/whatsapp (np. Notification::route(...))
        return redirect()->route(auth()->check() ? 'messages.index' : 'home')
            ->with('success', 'Wiadomość została wysłana!');
    }

    // Odpowiedź na wiadomość (tylko admin)
    public function reply(Request $request, $id)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $parent = KontaktMessage::findOrFail($id);

        $reply = KontaktMessage::create([
            'message'      => $request->message,
            'reply_to_id'  => $parent->id,
            'user_id'      => $parent->user_id,
            'admin_id'     => auth()->id(),
            'is_from_admin'=> true,
            'is_read'      => false,
        ]);

        // Możesz wysłać powiadomienie na email/whatsapp użytkownika

        return back()->with('success', 'Odpowiedź została wysłana.');
    }
}
