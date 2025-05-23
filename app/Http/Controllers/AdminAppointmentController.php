<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\ServiceVariant;
use App\Models\User;
use Illuminate\Http\Request;

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
    }

    public function updateAppointmentTime(Request $request, Appointment $appointment)
    {
        $request->validate([
            'appointment_at' => 'required|date',
        ]);

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
    public function show(Appointment $appointment)
    {
        return $appointment
            ->load(['user', 'serviceVariant.service'])
            ->only(['id','user','serviceVariant','appointment_at','status','canceled_reason']);
    }
    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'service_variant_id' => 'required|exists:service_variants,id',
            'appointment_at' => 'required|date',
        ]);

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

    // 🔽 NOWE: API do dropdownów

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
                    'name' => $variant->service->name . ' – ' . $variant->name,
                ];
            });
    }
}
