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
            return [
                'title' => $appointment->user->name . ' — ' . $appointment->serviceVariant->service->name,
                'start' => $appointment->start_time,
                'end'   => $appointment->end_time,
                'extendedProps' => [
                    'user'     => $appointment->user->name,
                    'service'  => $appointment->serviceVariant->service->name,
                    'variant'  => $appointment->serviceVariant->name,
                    'status'   => $appointment->status,
                    'notes'    => $appointment->notes,
                ],
            ];
        });

        return response()->json($events);
    }
}
