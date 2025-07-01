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

        $message->replies()
            ->where('is_from_admin', false)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        if (! $message->is_read) {
            $message->update(['is_read' => true]);
        }

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
        // Powiadomienia są wysyłane przez KontaktMessageObserver
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
        // Zamień puste wartości godzin pracy na null,
        // aby poprawnie zadziałała walidacja z opcją "nullable"
        $workingHoursInput = $request->input('working_hours', []);
        foreach ($workingHoursInput as $day => $hours) {
            if (is_array($hours)) {
                $start = $hours[0] ?? null;
                $end = $hours[1] ?? null;
                $workingHoursInput[$day][0] = $start !== '' ? $start : null;
                $workingHoursInput[$day][1] = $end !== '' ? $end : null;
            }
        }
        $request->merge(['working_hours' => $workingHoursInput]);

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
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
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
        $workingHours = [];
        foreach (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as $day) {
            $dayHours = $request->input("working_hours.$day", null);
            $start = $dayHours[0] ?? null;
            $end = $dayHours[1] ?? null;
            if ($start !== null && $end !== null) {
                $workingHours[$day] = [$start, $end];
            } else {
                $workingHours[$day] = null;
            }
        }

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
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
        ]);

        return redirect()->route('admin.kontakt.edit')->with('success', 'Dane kontaktowe zostały zaktualizowane.');
    }
}
