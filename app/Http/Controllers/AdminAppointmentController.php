<?php
namespace App\Http\Controllers;
use App\Models\Appointment;
use App\Models\ServiceVariant;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AdminAppointmentController extends Controller
{
    public function calendar()
    {
        return view('admin.appointments.calendar');
    }
    
    public function api()
    {
        $appointments = Appointment::with(['user', 'serviceVariant.service'])->get();
        return $appointments->map(function ($appointment) {
            $color = match ($appointment->status) {
                'odbyta' => '#38a169',
                'odwołana' => '#e53e3e',
                'nieodbyta' => '#f59e0b',
                default => '#3b82f6',
            };
            return [
                'id' => $appointment->id,
                'title' => $appointment->user->name . ' — ' . $appointment->serviceVariant->service->name,
                'start' => $appointment->appointment_at,
                'end' => Carbon::parse($appointment->appointment_at)
                    ->addMinutes($appointment->serviceVariant->duration_minutes ?? 60)
                    ->toDateTimeString(),
                'color' => $color,
                'extendedProps' => [
                    'user' => $appointment->user->name,
                    'service' => $appointment->serviceVariant->service->name,
                    'variant' => $appointment->serviceVariant->variant_name,
                    'datetime' => $appointment->appointment_at->format('Y-m-d H:i'),
                    'status' => $appointment->status,
                    'duration' => $appointment->serviceVariant->duration_minutes ?? 60,
                    'user_id' => $appointment->user_id,
                    'service_id' => $appointment->service_id,
                    'service_variant_id' => $appointment->service_variant_id,
                    'price_pln' => $appointment->price_pln,
                    'discount_percent' => $appointment->discount_percent,
                    'note_client' => $appointment->note_client,
                    'note_internal' => $appointment->note_internal,
                    'service_description' => $appointment->service_description,
                    'products_used' => $appointment->products_used,
                    'amount_paid_pln' => $appointment->amount_paid_pln,
                    'payment_method' => $appointment->payment_method,
                ],
            ];
        });
    }
    
    public function updateAppointmentTime(Request $request, Appointment $appointment)
    {
        $request->validate([
            'appointment_at' => 'required|date',
        ]);
        
        // Sprawdzenie czy nowy termin jest w godzinach pracy
        $newDateTime = Carbon::parse($request->appointment_at);
        $dayOfWeek = $newDateTime->dayOfWeek;
        $timeOfDay = $newDateTime->format('H:i');
        
        // Pobierz godziny pracy dla danego dnia tygodnia
        // Domyślne godziny pracy
        $workingHoursStart = '09:00';
        $workingHoursEnd = '18:00';
        $isWorkingDay = in_array($dayOfWeek, [1, 2, 3, 4, 5, 6]); // Poniedziałek-Sobota
        
        // Sprawdź czy dzień jest dniem roboczym
        if (!$isWorkingDay) {
            throw ValidationException::withMessages([
                'appointment_at' => ['Nie można zaplanować rezerwacji poza dniami roboczymi.'],
            ]);
        }
        
        // Sprawdź czy godzina jest w zakresie godzin pracy
        if ($timeOfDay < $workingHoursStart || $timeOfDay > $workingHoursEnd) {
            throw ValidationException::withMessages([
                'appointment_at' => ['Nie można zaplanować rezerwacji poza godzinami pracy.'],
            ]);
        }
        
        $appointment->update(['appointment_at' => $request->appointment_at]);
        return response()->json(['success' => true]);
    }
    
    public function updateStatus(Request $request, Appointment $appointment)
    {
        $request->validate([
            'status' => 'required|in:zaplanowana,odbyta,odwołana,nieodbyta',
            'canceled_reason' => 'nullable|string|max:255',
        ]);
        $appointment->update([
            'status' => $request->status,
            'canceled_reason' => $request->status === 'odwołana' ? $request->canceled_reason : null,
        ]);
        return response()->json(['success' => true]);
    }
    
    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'service_variant_id' => 'required|exists:service_variants,id',
            'appointment_at' => 'required|date',
            'price_pln' => 'required|integer|min:0',
            'discount_percent' => 'nullable|integer|min:0|max:100',
            'service_description' => 'nullable|string',
            'products_used' => 'nullable|string',
        ]);
        
        // Sprawdzenie czy termin jest w godzinach pracy
        $newDateTime = Carbon::parse($request->appointment_at);
        $dayOfWeek = $newDateTime->dayOfWeek;
        $timeOfDay = $newDateTime->format('H:i');
        
        // Domyślne godziny pracy
        $workingHoursStart = '09:00';
        $workingHoursEnd = '18:00';
        $isWorkingDay = in_array($dayOfWeek, [1, 2, 3, 4, 5, 6]); // Poniedziałek-Sobota
        
        // Sprawdź czy dzień jest dniem roboczym
        if (!$isWorkingDay) {
            throw ValidationException::withMessages([
                'appointment_at' => ['Nie można zaplanować rezerwacji poza dniami roboczymi.'],
            ]);
        }
        
        // Sprawdź czy godzina jest w zakresie godzin pracy
        if ($timeOfDay < $workingHoursStart || $timeOfDay > $workingHoursEnd) {
            throw ValidationException::withMessages([
                'appointment_at' => ['Nie można zaplanować rezerwacji poza godzinami pracy.'],
            ]);
        }
        
        $variant = ServiceVariant::with('service')->findOrFail($request->service_variant_id);
        $discount = $request->discount_percent ?? 0;
        $price    = $request->price_pln ?? $variant->price_pln;
        $price    = round($price * (100 - $discount) / 100);

        $appointment = Appointment::create([
            'user_id' => $request->user_id,
            'service_id' => $variant->service_id,
            'service_variant_id' => $variant->id,
            'price_pln' => $price,
            'discount_percent' => $discount,
            'appointment_at' => $request->appointment_at,
            'status' => 'zaplanowana',
            'service_description' => $request->service_description,
            'products_used' => $request->products_used,
        ]);
        return response()->json(['success' => true, 'id' => $appointment->id]);
    }

    public function update(Request $request, Appointment $appointment)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'service_variant_id' => 'required|exists:service_variants,id',
            'appointment_at' => 'required|date',
            'status' => 'required|in:zaplanowana,odbyta,odwołana,nieodbyta',
            'price_pln' => 'required|integer|min:0',
            'discount_percent' => 'nullable|integer|min:0|max:100',
            'service_description' => 'nullable|string',
            'products_used' => 'nullable|string',
        ]);

        $newDateTime = Carbon::parse($request->appointment_at);
        $dayOfWeek = $newDateTime->dayOfWeek;
        $timeOfDay = $newDateTime->format('H:i');
        $workingHoursStart = '09:00';
        $workingHoursEnd = '18:00';
        $isWorkingDay = in_array($dayOfWeek, [1, 2, 3, 4, 5, 6]);
        if (!$isWorkingDay || $timeOfDay < $workingHoursStart || $timeOfDay > $workingHoursEnd) {
            throw ValidationException::withMessages([
                'appointment_at' => ['Nie można zaplanować rezerwacji poza godzinami pracy.'],
            ]);
        }

        $variant = ServiceVariant::with('service')->findOrFail($request->service_variant_id);
        $discount = $request->discount_percent ?? 0;
        $price    = $request->price_pln ?? $variant->price_pln;
        $price    = round($price * (100 - $discount) / 100);

        $appointment->update([
            'user_id' => $request->user_id,
            'service_id' => $variant->service_id,
            'service_variant_id' => $variant->id,
            'price_pln' => $price,
            'discount_percent' => $discount,
            'appointment_at' => $request->appointment_at,
            'status' => $request->status,
            'service_description' => $request->service_description,
            'products_used' => $request->products_used,
        ]);

        return response()->json(['success' => true]);
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();
        return response()->json(['success' => true]);
    }
    
    // API do dropdownów
    public function users()
    {
        return User::select('id', 'name')->orderBy('name')->get();
    }
    
    public function variants()
    {
        return ServiceVariant::with('service')
            ->get()
            ->map(function ($variant) {
                return [
                    'id' => $variant->id,
                    'service_id' => $variant->service_id,
                    'variant_name' => $variant->variant_name,
                    'duration_minutes' => $variant->duration_minutes,
                    'price_pln' => $variant->price_pln,
                ];
            });
    }

    public function services()
    {
        return Service::select('id', 'name')->orderBy('name')->get();
    }

    public function variantsForService(Service $service)
    {
        return $service->variants()->select('id', 'service_id', 'variant_name', 'duration_minutes', 'price_pln')->get();
    }
    
    // Pobieranie godzin pracy
    public function workingHours()
    {
        // Domyślne godziny pracy
        $workingHours = [
            'start' => '09:00',
            'end' => '18:00',
            'daysOfWeek' => [1, 2, 3, 4, 5, 6], // Poniedziałek-Sobota
        ];

        return response()->json($workingHours);
    }

    // Historia wizyt klienta dla danej wizyty
    public function history(Appointment $appointment)
    {
        $appointments = Appointment::where('user_id', $appointment->user_id)
            ->with('serviceVariant.service')
            ->orderByDesc('appointment_at')
            ->get([
                'id',
                'appointment_at',
                'service_variant_id',
                'note_client',
                'note_internal',
                'service_description',
                'products_used',
            ])
            ->map(function ($a) {
                return [
                    'id' => $a->id,
                    'appointment_at' => $a->appointment_at->format('Y-m-d H:i'),
                    'service_name' => optional($a->serviceVariant->service)->name,
                    'note_client' => $a->note_client,
                    'note_internal' => $a->note_internal,
                    'service_description' => $a->service_description,
                    'products_used' => $a->products_used,
                ];
            });

        return response()->json($appointments);
    }

    // Finalizacja wizyty
    public function finalize(Request $request, Appointment $appointment)
    {
        $request->validate([
            'note_client' => 'nullable|string',
            'note_internal' => 'nullable|string',
            'service_description' => 'nullable|string',
            'products_used' => 'nullable|string',
            'amount_paid_pln' => 'nullable|integer|min:0',
            'payment_method' => 'nullable|string|max:50',
        ]);

        $appointment->update([
            'note_client' => $request->note_client,
            'note_internal' => $request->note_internal,
            'service_description' => $request->service_description,
            'products_used' => $request->products_used,
            'amount_paid_pln' => $request->amount_paid_pln,
            'payment_method' => $request->payment_method,
            'status' => 'odbyta',
        ]);

        return response()->json(['success' => true]);
    }
}
