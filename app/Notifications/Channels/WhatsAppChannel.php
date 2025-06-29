<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;

class WhatsAppChannel
{
    public function send($notifiable, Notification $notification): void
    {
        $message = $notification->toWhatsApp($notifiable);
        if (! $message || empty($message['to']) || empty($message['body'])) {
            return;
        }

        $token = config('services.whatsapp.token');
        $phoneNumberId = config('services.whatsapp.phone_number_id');

        if (! $token || ! $phoneNumberId) {
            return;
        }

        Http::withToken($token)->post(
            "https://graph.facebook.com/v19.0/{$phoneNumberId}/messages",
            [
                'messaging_product' => 'whatsapp',
                'to' => $message['to'],
                'type' => 'text',
                'text' => [
                    'body' => $message['body'],
                ],
            ]
        );
    }
}

