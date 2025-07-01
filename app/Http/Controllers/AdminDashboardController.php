<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\KontaktMessage;
use App\Models\User;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $nextAppointment = Appointment::with(['user', 'serviceVariant.service'])
            ->where('appointment_at', '>=', now())
            ->orderBy('appointment_at')
            ->first();

        $upcomingCount = Appointment::where('appointment_at', '>=', now())->count();

        $pendingCount = Appointment::whereIn('status', ['oczekuje', 'proponowana'])->count();

        $unreadMessages = KontaktMessage::where('is_from_admin', false)
            ->where('is_read', false)
            ->count();

        $userCount = User::count();

        return view('admin.dashboard', [
            'nextAppointment' => $nextAppointment,
            'upcomingCount' => $upcomingCount,
            'pendingCount' => $pendingCount,
            'unreadMessages' => $unreadMessages,
            'userCount' => $userCount,
        ]);
    }
}
