<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;

class WhatsAppChannel
{
    public function send($notifiable, Notification $notification): void
    {
        $message = $notification->toWhatsApp($notifiable);
        if (!$message || empty($message['to']) || empty($message['template_name'])) {
            return;
        }

        Http::withToken(config('services.whatsapp.token'))
            ->post('https://graph.facebook.com/v18.0/' . config('services.whatsapp.phone_id') . '/messages', [
                'messaging_product' => 'whatsapp',
                'to' => $message['to'],
                'type' => 'template',
                'template' => [
                    'name' => $message['template_name'],
                    'language' => ['code' => $message['lang'] ?? config('services.whatsapp.lang', 'pl')],
                    'components' => [
                        [
                            'type' => 'body',
                            'parameters' => array_map(fn($text) => ['type' => 'text', 'text' => $text], $message['parameters'] ?? []),
                        ],
                    ],
                ],
            ]);
    }
}
