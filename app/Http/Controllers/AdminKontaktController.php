<?php

namespace App\Http\Controllers;

use App\Models\KontaktMessage;

class AdminKontaktController extends Controller
{
    public function index()
    {
        // Wszystkie zapytania klientów (bez odpowiedzi admina)
        $messages = KontaktMessage::where('is_from_admin', false)
            ->whereNull('reply_to_id')
            ->latest()
            ->with(['user', 'replies'])
            ->get();

        return view('admin.messages.index', compact('messages'));
    }

    public function show($id)
    {
        $message = KontaktMessage::with(['user', 'replies.user', 'replies.admin'])->findOrFail($id);
        return view('admin.messages.show', compact('message'));
    }

    public function reply(Request $request, $id)
    {
        $parent = KontaktMessage::findOrFail($id);
        $request->validate(['message' => 'required|string|min:2']);

        KontaktMessage::create([
            'user_id'      => $parent->user_id,
            'admin_id'     => auth()->id(),
            'message'      => $request->message,
            'reply_to_id'  => $parent->id,
            'is_from_admin'=> true,
            'is_read'      => false,
        ]);
        // Możesz wysłać maila/SMS/WhatsApp do klienta...
        return back()->with('success', 'Odpowiedź wysłana do klienta.');
    }
}
