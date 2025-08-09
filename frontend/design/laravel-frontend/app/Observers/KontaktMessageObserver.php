<?php

namespace App\Observers;

use App\Models\KontaktMessage;
use App\Notifications\NewMessageNotification;

class KontaktMessageObserver
{
    public function created(KontaktMessage $message): void
    {
        if ($message->is_from_admin && $message->user) {
            $message->user->notify(new NewMessageNotification($message));
        }
    }
}
