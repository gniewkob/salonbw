<?php

namespace App\Http\Controllers;

use App\Models\Blocker;
use Carbon\Carbon;

class AdminBlockerController extends Controller
{
    public function calendar()
    {
        return view('admin.blockers.calendar');
    }

    public function api()
    {
        return Blocker::all()->map(function ($blocker) {
            return [
                'id' => $blocker->id,
                'title' => 'Blokada',
                'start' => $blocker->starts_at,
                'end' => ($blocker->ends_at ?? Carbon::parse($blocker->starts_at)->addHour())->toDateTimeString(),
                'color' => '#6b7280',
                'extendedProps' => [
                    'note' => $blocker->note,
                ],
            ];
        });
    }
}
