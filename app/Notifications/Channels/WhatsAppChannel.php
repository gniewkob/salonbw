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
        if (!$message || empty($message['to']) || empty($message['body'])) {
            return;
        }

        $response = Http::withBasicAuth(config('services.twilio.sid'), config('services.twilio.token'))
            ->asForm()
            ->post('https://api.twilio.com/2010-04-01/Accounts/' . config('services.twilio.sid') . '/Messages.json', [
                'From' => 'whatsapp:' . config('services.twilio.whatsapp_from'),
                'To' => 'whatsapp:' . $message['to'],
                'Body' => $message['body'],
            ]);

        WhatsAppMessageLog::create([
            'recipient' => $message['to'],
            'template' => $message['template'] ?? null,
            'parameters' => $message['parameters'] ?? [],
            'status' => $response->json('status'),
            'response_id' => $response->json('sid'),
            'error_code' => $response->json('error_code'),
            'error_body' => $response->json('error_message'),
            'created_at' => now(),
        ]);
    }
}
