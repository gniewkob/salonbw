<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\KontaktMessage;
use App\Models\User;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $unreadMessages = KontaktMessage::where('is_from_admin', false)
            ->whereNull('reply_to_id')
            ->where(function ($query) {
                $query->whereDoesntHave('replies', function ($q) {
                    $q->where('is_from_admin', true);
                })->orWhereHas('replies', function ($q) {
                    $q->where('is_from_admin', false)
                        ->where('is_read', false);
                });
            })
            ->count();

        $userCount = User::count();

        $now = Carbon::now();

        $upcomingAppointments = Appointment::with('user')
            ->withExists('user.missedAppointments')
            ->where('appointment_at', '>=', $now)
            ->where('status', '!=', 'odwołana')
            ->orderBy('appointment_at')
            ->take(3)
            ->get();

        $upcomingAppointments->each(function ($appointment) {
            $appointment->has_missed = $appointment->user_missed_appointments_exists;
        });

        $currentStart   = $now->copy()->startOfMonth();
        $currentEnd     = $now->copy()->endOfMonth();
        $lastMonthStart = $now->copy()->subMonth()->startOfMonth();
        $lastMonthEnd   = $now->copy()->subMonth()->endOfMonth();
        $lastYearStart  = $now->copy()->subYear()->startOfMonth();
        $lastYearEnd    = $now->copy()->subYear()->endOfMonth();

        $completedThisMonth = Appointment::whereBetween('appointment_at', [$currentStart, $currentEnd])
            ->where('status', 'odbyta')
            ->count();

        $missedThisMonth = Appointment::whereBetween('appointment_at', [$currentStart, $currentEnd])
            ->where('status', 'nieodbyta')
            ->count();

        $completedLastMonth = Appointment::whereBetween('appointment_at', [$lastMonthStart, $lastMonthEnd])
            ->where('status', 'odbyta')
            ->count();

        $missedLastMonth = Appointment::whereBetween('appointment_at', [$lastMonthStart, $lastMonthEnd])
            ->where('status', 'nieodbyta')
            ->count();

        $completedLastYear = Appointment::whereBetween('appointment_at', [$lastYearStart, $lastYearEnd])
            ->where('status', 'odbyta')
            ->count();

        $missedLastYear = Appointment::whereBetween('appointment_at', [$lastYearStart, $lastYearEnd])
            ->where('status', 'nieodbyta')
            ->count();

        return view('admin.dashboard', [
            'unreadMessages'      => $unreadMessages,
            'userCount'          => $userCount,
            'upcomingAppointments' => $upcomingAppointments,
            'completedThisMonth' => $completedThisMonth,
            'missedThisMonth'    => $missedThisMonth,
            'completedLastMonth' => $completedLastMonth,
            'missedLastMonth'    => $missedLastMonth,
            'completedLastYear'  => $completedLastYear,
            'missedLastYear'     => $missedLastYear,
        ]);
    }
}
