<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use App\Mail\KontaktMail;
use App\Models\KontaktMessage;

class KontaktController extends Controller
{
	public function send(Request $request)
	{
		// Honeypot — pole "website" musi być puste
		if ($request->filled('website')) {
			return back()->withErrors(['Niepoprawna próba wysyłki.']);
		}

		$response = $request->get('h-captcha-response');

		if (!$response) {
			return back()->withErrors(['hcaptcha' => 'Potwierdź, że nie jesteś botem.']);
		}

		$verify = Http::asForm()->post('https://hcaptcha.com/siteverify', [
			'secret'   => env('HCAPTCHA_SECRET'),
			'response' => $response,
			'remoteip' => $request->ip(),
		]);

		if (!($verify->json()['success'] ?? false)) {
			return back()->withErrors(['hcaptcha' => 'Weryfikacja hCaptcha nie powiodła się.']);
		}

		// Walidacja pól formularza
		$validated = $request->validate([
			'name'    => 'required|string|max:100',
			'email'   => 'required|email',
			'phone'   => 'nullable|string|max:40',
			'message' => 'required|string|max:1000',
		]);

		// Zapisz wiadomość do bazy
		KontaktMessage::create([
			'name'    => $validated['name'],
			'email'   => $validated['email'],
			'phone'   => $validated['phone'] ?? null,
			'message' => $validated['message'],
		]);

		// Wyślij wiadomość e-mail
		Mail::to('kontakt@salon-bw.pl')->send(
			new KontaktMail(
				$validated['name'],
				$validated['email'],
				$validated['phone'] ?? '',
				$validated['message']
			)
		);

		// Powrót z komunikatem
		return back()->with('success', 'Dziękujemy! Twoja wiadomość została wysłana.');
	}

    public function myMessages()
    {
        $messages = KontaktMessage::where('user_id', auth()->id())
            ->whereNull('reply_to_id')
            ->latest()
            ->with('replies')
            ->get();

        return view('messages.index', compact('messages'));
    }

    public function show($id)
    {
        $message = KontaktMessage::with(['replies', 'replies.admin'])->findOrFail($id);
        abort_if($message->user_id !== auth()->id(), 403);

        return view('messages.show', compact('message'));
    }

    public function reply(Request $request, $id)
    {
        $parent = KontaktMessage::findOrFail($id);
        abort_if($parent->user_id !== auth()->id(), 403);

        $request->validate(['message' => 'required|string|min:2']);
        KontaktMessage::create([
            'user_id'      => auth()->id(),
            'message'      => $request->message,
            'reply_to_id'  => $parent->id,
            'is_from_admin'=> false,
        ]);
        // Możesz wysłać notyfikację mailową do admina...
        return back()->with('success', 'Odpowiedź wysłana.');
    }

}
