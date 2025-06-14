<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Appointment;
use App\Models\Service;
use App\Models\ServiceVariant;
use Illuminate\Support\Facades\Auth;

class AppointmentController extends Controller
{
    public function create(Request $request)
    {
        $services = Service::with('variants')->get();
        $preselectedVariant = $request->query('variant_id');

        return view('appointments.create', compact('services', 'preselectedVariant'));
    }
    public function api()
    {
        return Appointment::with('variant', 'service')->get()->map(function ($appt) {
            return [
                'title' => $appt->service->name . ' – ' . $appt->variant->variant_name,
                'start' => $appt->appointment_at,
            ];
        });
    }

    public function show($id)
    {
        $appointment = \App\Models\Appointment::with(['service', 'variant'])
            ->where('user_id', auth()->id())
            ->findOrFail($id);

        return view('appointments.show', compact('appointment'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_variant_id' => 'required|exists:service_variants,id',
            'appointment_at'     => 'required|date|after:now',
        ]);

        $variant = ServiceVariant::with('service')->findOrFail($validated['service_variant_id']);

        Appointment::create([
            'user_id'            => Auth::id(),
            'service_id'         => $variant->service->id,
            'service_variant_id' => $variant->id,
            'price_pln'          => $variant->price_pln,
            'appointment_at'     => $validated['appointment_at'],
            'status'             => 'zaplanowana',
        ]);

        return redirect()->route('dashboard')->with('success', 'Rezerwacja została zapisana.');
    }

    public function index()
    {
        $appointments = Appointment::with(['service', 'variant'])
            ->where('user_id', auth()->id())
            ->orderByDesc('appointment_at')
            ->paginate(10);

        return view('appointments.index', compact('appointments'));
    }
}
