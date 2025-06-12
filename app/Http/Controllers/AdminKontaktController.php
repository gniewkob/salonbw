<?php

namespace App\Http\Controllers;

use App\Models\ContactInfo;
use App\Models\KontaktMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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
            'name'         => auth()->user()->name,
            'email'        => auth()->user()->email,
            'phone'        => auth()->user()->phone ?? null,
            'message'      => $request->message,
            'reply_to_id'  => $parent->id,
            'is_from_admin'=> true,
            'is_read'      => false,
        ]);
        // Możesz wysłać maila/SMS/WhatsApp do klienta...
        return back()->with('success', 'Odpowiedź wysłana do klienta.');
    }

    /**
     * Show the form for editing the contact information.
     *
     * @return \Illuminate\View\View
     */
    public function edit()
    {
        $contactInfo = ContactInfo::getDefault();
        return view('admin.kontakt.edit', compact('contactInfo'));
    }

    /**
     * Update the contact information.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'salon_name' => 'nullable|string|max:255',
            'address_line1' => 'required|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'required|string|max:255',
            'postal_code' => 'required|string|max:20',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|max:255',
            'description' => 'nullable|string',
            'facebook_url' => 'nullable|url|max:255',
            'instagram_url' => 'nullable|url|max:255',
            'google_maps_url' => 'nullable|url|max:255',
            'working_hours.*.0' => 'nullable|date_format:H:i',
            'working_hours.*.1' => 'nullable|date_format:H:i|after:working_hours.*.0',
        ], [
            'working_hours.*.1.after' => 'Godzina zamknięcia musi być późniejsza niż godzina otwarcia.',
        ]);

        if ($validator->fails()) {
            return back()
                ->withErrors($validator)
                ->withInput();
        }

        $contactInfo = ContactInfo::getDefault();
        
        // Przygotowanie danych godzin pracy
        $workingHours = [
            'monday' => $request->input('working_hours.monday') ?? null,
            'tuesday' => $request->input('working_hours.tuesday') ?? null,
            'wednesday' => $request->input('working_hours.wednesday') ?? null,
            'thursday' => $request->input('working_hours.thursday') ?? null,
            'friday' => $request->input('working_hours.friday') ?? null,
            'saturday' => $request->input('working_hours.saturday') ?? null,
            'sunday' => $request->input('working_hours.sunday') ?? null,
        ];

        // Aktualizacja danych kontaktowych
        $contactInfo->update([
            'salon_name' => $request->salon_name,
            'address_line1' => $request->address_line1,
            'address_line2' => $request->address_line2,
            'city' => $request->city,
            'postal_code' => $request->postal_code,
            'phone' => $request->phone,
            'email' => $request->email,
            'description' => $request->description,
            'working_hours' => $workingHours,
            'facebook_url' => $request->facebook_url,
            'instagram_url' => $request->instagram_url,
            'google_maps_url' => $request->google_maps_url,
        ]);

        return redirect()->route('admin.kontakt.edit')->with('success', 'Dane kontaktowe zostały zaktualizowane.');
    }
}
