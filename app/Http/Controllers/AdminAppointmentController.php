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

}
