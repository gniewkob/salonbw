<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Appointment;

class AdminAppointmentController extends Controller
{
    public function calendar()
    {
        return view('admin.appointments.calendar');
    }

    public function api(Request $request)
    {
        $appointments = Appointment::with(['user', 'serviceVariant.service'])->get();

        $events = $appointments->map(function ($appointment) {
            $color = match ($appointment->status) {
                'odbyta' => '#38a169',        // zielony
                'odwołana' => '#e53e3e',      // czerwony
                default => '#3182ce',         // niebieski (zaplanowana lub inne)
            };

            return [
                'id' => $appointment->id,
                'title' => $appointment->user->name . ' — ' . $appointment->serviceVariant->service->name,
                'start' => $appointment->appointment_at,
                'color' => $color,
                'extendedProps' => [
                    'user' => $appointment->user->name,
                    'service' => $appointment->serviceVariant->service->name,
                    'variant' => $appointment->serviceVariant->name,
                    'datetime' => $appointment->appointment_at->format('Y-m-d H:i'),
                    'status' => $appointment->status,
                ],
            ];
        });

        return response()->json($events);
    }

    public function updateAppointmentTime(Request $request, Appointment $appointment)
    {
        $request->validate([
            'appointment_at' => 'required|date',
        ]);

        $appointment->update([
            'appointment_at' => $request->appointment_at,
        ]);

        return response()->json([
            'success' => true,
            'updated' => $appointment->appointment_at,
        ]);
    }
    
    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'service_variant_id' => 'required|exists:service_variants,id',
            'appointment_at' => 'required|date',
        ]);
    
        $appointment = Appointment::create([
            'user_id' => $request->user_id,
            'service_id' => ServiceVariant::find($request->service_variant_id)->service_id,
            'service_variant_id' => $request->service_variant_id,
            'appointment_at' => $request->appointment_at,
            'status' => 'zaplanowana',
        ]);
    
        return response()->json(['success' => true, 'id' => $appointment->id]);
    }
    
    public function cancel(Request $request, Appointment $appointment)
    {
        $appointment->update([
            'status' => 'odwołana',
            'canceled_reason' => $request->input('reason', 'anulowana przez klienta'),
        ]);
    
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


}
