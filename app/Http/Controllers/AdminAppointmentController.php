<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;

class AdminAppointmentController extends Controller
{
	public function calendar()
	{
		return view('admin.appointments.calendar');
	}

	public function api()
	{
		try {
			$appointments = \App\Models\Appointment::with(['user', 'service', 'variant'])->get();
	
			$events = $appointments->map(function ($appointment) {
				$title = '';
	
				if ($appointment->user && $appointment->service) {
					$title = $appointment->user->name . ' - ' . $appointment->service->name;
	
					if ($appointment->variant) {
						$title .= ' (' . $appointment->variant->variant_name . ')';
					}
				}
	
				$start = optional($appointment->appointment_at)->copy();
				$end = $start ? $start->copy()->addMinutes($appointment->variant->duration_minutes ?? 60) : null;
	
				return [
					'id' => $appointment->id,
					'title' => $title ?: 'Rezerwacja',
					'start' => $start?->toIso8601String(),
					'end' => $end?->toIso8601String(),
					'backgroundColor' => '#2563eb',
					'borderColor' => '#1d4ed8',
					'textColor' => '#ffffff',
				];
			});
	
			return response()->json($events);
	
		} catch (\Throwable $e) {
			\Log::error('Błąd API kalendarza: ' . $e->getMessage());
			return response()->json([
				'error' => 'Wystąpił błąd podczas generowania danych kalendarza.',
				'details' => $e->getMessage(),
			], 500);
		}
	}

}