<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use App\Models\WhatsAppMessageLog;

class WhatsAppChannel
{
    public function send($notifiable, Notification $notification): void
    {
        $message = $notification->toWhatsApp($notifiable);
        if (! $message || empty($message['to']) || empty($message['template_name'])) {
            return;
        }

        $response = Http::withToken(config('services.whatsapp.token'))
            ->post('https://graph.facebook.com/v18.0/' . config('services.whatsapp.phone_id') . '/messages', [
                'messaging_product' => 'whatsapp',
                'to' => $message['to'],
                'type' => 'template',
                'template' => [
                    'name' => $message['template_name'],
                    'language' => [
                        'code' => $message['lang'] ?? config('services.whatsapp.lang', 'pl'),
                    ],
                    'components' => [
                        [
                            'type' => 'body',
                            'parameters' => array_map(fn($text) => ['type' => 'text', 'text' => $text], $message['parameters'] ?? []),
                        ],
                    ],
                ],
            ]);

        WhatsAppMessageLog::create([
            'recipient'   => $message['to'],
            'template'    => $message['template_name'],
            'parameters'  => $message['parameters'] ?? [],
            'status'      => $response->json('status') ?? ($response->ok() ? 'sent' : null),
            'response_id' => data_get($response->json(), 'messages.0.id'),
            'error_code'  => data_get($response->json(), 'error.code'),
            'error_body'  => data_get($response->json(), 'error.message'),
            'created_at'  => now(),
        ]);
    }
}
