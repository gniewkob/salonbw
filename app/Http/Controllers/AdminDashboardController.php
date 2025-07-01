<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\KontaktMessage;
use App\Models\User;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $unreadMessages = KontaktMessage::where('is_from_admin', false)
            ->where('is_read', false)
            ->count();

        $userCount = User::count();

        return view('admin.dashboard', [
            'unreadMessages' => $unreadMessages,
            'userCount' => $userCount,
        ]);
    }
}
