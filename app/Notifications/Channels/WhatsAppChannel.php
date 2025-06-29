<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppChannel
{
    public function send($notifiable, Notification $notification): void
    {
        $message = $notification->toWhatsApp($notifiable);
        if (!$message || empty($message['to']) || empty($message['body'])) {
            return;
        }

        Http::withBasicAuth(config('services.twilio.sid'), config('services.twilio.token'))
            ->asForm()
            ->post('https://api.twilio.com/2010-04-01/Accounts/' . config('services.twilio.sid') . '/Messages.json', [
                'From' => 'whatsapp:' . config('services.twilio.whatsapp_from'),
                'To' => 'whatsapp:' . $message['to'],
                'Body' => $message['body'],
            ]);

        Log::info('WhatsApp message sent', [
            'to' => $message['to'],
            'body' => $message['body'],
        ]);
    }
}
