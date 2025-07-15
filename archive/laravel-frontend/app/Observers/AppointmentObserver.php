<?php

namespace App\Observers;

use App\Models\Appointment;
use App\Notifications\StatusChangeNotification;

class AppointmentObserver
{
    public function updated(Appointment $appointment): void
    {
        if ($appointment->wasChanged('status')) {
            $appointment->user?->notify(new StatusChangeNotification($appointment));
        }
    }
}
