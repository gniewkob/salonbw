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
                    ->addMinutes($appointment->serviceVariant->duration ?? 60)
                    ->toDateTimeString(),
                'color' => $color,
                'extendedProps' => [
                    'user' => $appointment->user->name,
                    'service' => $appointment->serviceVariant->service->name,
                    'variant' => $appointment->serviceVariant->name,
                    'datetime' => $appointment->appointment_at->format('Y-m-d H:i'),
                    'status' => $appointment->status,
                    'duration' => $appointment->serviceVariant->duration ?? 60,
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
        $appointment = Appointment::create([
            'user_id' => $request->user_id,
            'service_id' => $variant->service_id,
            'service_variant_id' => $variant->id,
            'appointment_at' => $request->appointment_at,
            'status' => 'zaplanowana',
        ]);
        return response()->json(['success' => true, 'id' => $appointment->id]);
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
                ];
            });
    }

    public function services()
    {
        return Service::select('id', 'name')->orderBy('name')->get();
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
}
