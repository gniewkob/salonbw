<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\KontaktMessage;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $userId = Auth::id();

        $nextAppointment = Appointment::where('user_id', $userId)
            ->where('appointment_at', '>=', now())
            ->orderBy('appointment_at')
            ->first();

        $currentYear = now()->year;

        $pastCount = Appointment::where('user_id', $userId)
            ->whereYear('appointment_at', $currentYear)
            ->where('status', 'odbyta')
            ->count();

        $missedCount = Appointment::where('user_id', $userId)
            ->whereYear('appointment_at', $currentYear)
            ->where('status', 'nieodbyta')
            ->count();

        $pendingCount = Appointment::where('user_id', $userId)
            ->whereIn('status', ['oczekuje', 'proponowana'])
            ->count();

        $unreadMessages = KontaktMessage::where('user_id', $userId)
            ->where('is_from_admin', true)
            ->where('is_read', false)
            ->count();

        return view('dashboard', [
            'nextAppointment' => $nextAppointment,
            'pastCount'       => $pastCount,
            'missedCount'     => $missedCount,
            'pendingCount'    => $pendingCount,
            'unreadMessages'  => $unreadMessages,
            'messagesUrl'     => route('messages.index'),
            'pendingUrl'      => route('appointments.index'),
        ]);
    }
}
