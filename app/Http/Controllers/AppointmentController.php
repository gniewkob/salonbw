<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Appointment;
use App\Models\Service;
use App\Models\ServiceVariant;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Notifications\StatusChangeNotification;

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
            'note_user'          => 'nullable|string',
            'allow_pending'      => 'nullable|boolean',
            'coupon_code'        => 'nullable|string|exists:coupons,code',
        ]);

        $variant = ServiceVariant::with('service')->findOrFail($validated['service_variant_id']);

        // Sprawdzenie czy termin jest wolny
        $start = new \Carbon\Carbon($validated['appointment_at']);
        $end   = (clone $start)->addMinutes($variant->duration_minutes);

        $existing = Appointment::with('serviceVariant')
            ->whereDate('appointment_at', $start->toDateString())
            ->get();

        $status = 'zaplanowana';
        foreach ($existing as $appt) {
            $apptEnd = (clone $appt->appointment_at)->addMinutes($appt->serviceVariant->duration_minutes);
            if ($start < $apptEnd && $end > $appt->appointment_at) {
                if (empty($validated['allow_pending'])) {
                    return back()->withErrors(['appointment_at' => 'Wybrany termin jest już zajęty.'])
                        ->withInput();
                }
                $status = 'oczekuje';
                break;
            }
        }

        $discount = 0;
        $coupon = null;
        if (!empty($validated['coupon_code'])) {
            $coupon = \App\Models\Coupon::where('code', $validated['coupon_code'])->first();
            if (!$coupon || !$coupon->isValid()) {
                return back()->withErrors(['coupon_code' => 'Nieprawidłowy kupon.'])->withInput();
            }
            $discount = $coupon->discount_percent;
        }

        $price = round($variant->price_pln * (100 - $discount) / 100);

        Appointment::create([
            'user_id'            => Auth::id(),
            'service_id'         => $variant->service->id,
            'service_variant_id' => $variant->id,
            'coupon_id'          => $coupon?->id,
            'price_pln'          => $price,
            'discount_percent'   => $discount,
            'appointment_at'     => $validated['appointment_at'],
            'status'             => $status,
            'note_user'          => $validated['note_user'] ?? null,
        ]);

        if ($coupon) {
            $coupon->increment('used_count');
        }

        return redirect()->route('dashboard')->with('success', 'Rezerwacja została zapisana.');
    }

    public function busyTimes()
    {
        $appointments = Appointment::with('serviceVariant')->get();

        return $appointments->map(function ($appt) {
            $end = (clone $appt->appointment_at)->addMinutes($appt->serviceVariant->duration_minutes ?? 60);
            return [
                'start' => $appt->appointment_at,
                'end'   => $end,
            ];
        });
    }

    public function index()
    {
        $appointments = Appointment::with(['service', 'variant'])
            ->where('user_id', auth()->id())
            ->orderByDesc('appointment_at')
            ->paginate(10);

        return view('appointments.index', compact('appointments'));
    }

    public function confirm(Appointment $appointment)
    {
        abort_unless($appointment->user_id === Auth::id(), 403);

        abort_unless(in_array($appointment->status, ['oczekuje', 'proponowana']), 404);

        $appointment->update(['status' => 'zaplanowana']);

        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            $admin->notify(new StatusChangeNotification($appointment));
        }

        return redirect()->route('appointments.index')
            ->with('success', 'Rezerwacja została potwierdzona.');
    }

    public function decline(Appointment $appointment)
    {
        abort_unless($appointment->user_id === Auth::id(), 403);

        abort_unless(in_array($appointment->status, ['oczekuje', 'proponowana']), 404);

        $appointment->update(['status' => 'odwołana']);

        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            $admin->notify(new StatusChangeNotification($appointment));
        }

        return redirect()->route('appointments.index')
            ->with('success', 'Rezerwacja została odwołana.');
    }
}
