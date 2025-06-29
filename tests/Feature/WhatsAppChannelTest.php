<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\Channels\WhatsAppChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class WhatsAppChannelTest extends TestCase
{
    use RefreshDatabase;

    public function test_channel_sends_payload_and_logs(): void
    {
        Http::fake();
        Log::shouldReceive('info')->once()->with('WhatsApp message sent', [
            'to' => '5551234',
            'body' => 'Test Body',
        ]);

        config()->set('services.twilio.sid', 'ACXXXXX');
        config()->set('services.twilio.token', 'token');
        config()->set('services.twilio.whatsapp_from', '12345');

        $user = User::factory()->create(['phone' => '5551234']);

        $notification = new class extends Notification {
            public function via(object $notifiable): array
            {
                return [WhatsAppChannel::class];
            }

            public function toWhatsApp(object $notifiable): array
            {
                return [
                    'to' => $notifiable->phone,
                    'body' => 'Test Body',
                ];
            }
        };

        $user->notify($notification);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://api.twilio.com/2010-04-01/Accounts/'.config('services.twilio.sid').'/Messages.json'
                && $request['From'] === 'whatsapp:'.config('services.twilio.whatsapp_from')
                && $request['To'] === 'whatsapp:5551234'
                && $request['Body'] === 'Test Body';
        });
    }
}
