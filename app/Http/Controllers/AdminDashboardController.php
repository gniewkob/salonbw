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

        return view('admin.dashboard', [
            'unreadMessages' => $unreadMessages,
            'userCount' => $userCount,
        ]);
    }
}
