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
            ->whereNull('reply_to_id')
            ->whereIn('status', [
                KontaktMessage::STATUS_SENT,
                KontaktMessage::STATUS_NEW_REPLY,
            ])
            ->count();

        $userCount = User::count();

        return view('admin.dashboard', [
            'unreadMessages' => $unreadMessages,
            'userCount' => $userCount,
        ]);
    }
}
