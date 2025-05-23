<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Appointment;
use Illuminate\Support\Facades\Auth;

class AdminAppointmentController extends Controller
{
    public function index()
    {
        $appointments = Appointment::with(['service', 'variant', 'user'])
            ->orderByDesc('appointment_at')
            ->paginate(20);

        return view('admin.appointments.index', compact('appointments'));
    }

    public function edit($id)
    {
        $appointment = Appointment::with(['service', 'variant', 'user'])->findOrFail($id);
        return view('admin.appointments.edit', compact('appointment'));
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'note_client'   => 'nullable|string',
            'note_internal' => 'nullable|string',
            'status'        => 'required|string|in:zaplanowana,odbyta,odwołana',
        ]);
        $appointment = Appointment::findOrFail($id);
        $appointment->update($validated);

        return redirect()->route('admin.appointments.index')->with('success', 'Wizyta zaktualizowana!');
    }

    public function calendar()
    {
        return view('admin.appointments.calendar');
    }


}
