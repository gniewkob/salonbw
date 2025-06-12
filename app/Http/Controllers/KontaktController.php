<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\KontaktMessage;

class KontaktController extends Controller
{
    public function myMessages()
    {
        $messages = KontaktMessage::where('user_id', auth()->id())
            ->whereNull('reply_to_id')
            ->with('replies')
            ->orderByDesc('created_at')
            ->get();

        return view('messages.index', compact('messages'));
    }

    public function show($id)
    {
        $message = KontaktMessage::with(['replies', 'replies.admin'])->findOrFail($id);
        abort_if($message->user_id !== auth()->id(), 403);

        return view('messages.show', compact('message'));
    }

    public function create()
    {
        return view('messages.create');
    }

    public function store(Request $request)
    {
        if (auth()->check()) {
            $request->validate([
                'message' => 'required|string|max:2000',
                'category' => 'nullable|string|max:255',
                'phone' => 'nullable|regex:/^[+0-9\s\-\(\)]{7,20}$/',
            ]);

            KontaktMessage::create([
                'user_id'       => auth()->id(),
                'name'          => auth()->user()->name ?? 'Zalogowany użytkownik',
                'email'         => auth()->user()->email,
                'phone'         => auth()->user()->phone ?? null, // dodane
                'message'       => $request->message,
                'category'      => $request->category,
                'reply_to_id'   => null, // ensure new thread
                'is_from_admin' => false,
                'is_read'       => false,
                'status'        => 'nowa',
            ]);
        } else {
            $request->validate([
                'name'     => 'required|string|max:100',
                'email'    => 'required|email|max:255',
                'phone'    => 'nullable|string|max:30',
                'message'  => 'required|string|max:2000',
                'category' => 'nullable|string|max:255',
            ]);

            KontaktMessage::create([
                'name'           => $request->name,
                'email'          => $request->email,
                'phone'          => $request->phone,
                'message'        => $request->message,
                'category'       => $request->category,
                'reply_to_id'    => null, // ensure new thread for guests
                'is_from_admin'  => false,
                'is_read'        => false,
                'status'         => 'nowa',
            ]);
        }

        return redirect()->route(auth()->check() ? 'messages.index' : 'home')
            ->with('success', 'Wiadomość została wysłana.');
    }

    public function reply(Request $request, $id)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $parent = KontaktMessage::findOrFail($id);
        abort_if($parent->user_id !== auth()->id(), 403);

        KontaktMessage::create([
            'name'          => auth()->user()->name ?? 'Użytkownik',
            'email'         => auth()->user()->email,
            'phone'         => auth()->user()->phone ?? null,
            'message'       => $request->message,
            'reply_to_id'   => $parent->id,
            'user_id'       => auth()->id(),
            'is_from_admin' => false,
            'is_read'       => false,
            'status'        => 'nowa',
        ]);

        return back()->with('success', 'Twoja wiadomość została wysłana.');
    }
}
