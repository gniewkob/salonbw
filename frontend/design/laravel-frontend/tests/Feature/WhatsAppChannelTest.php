<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\Channels\WhatsAppChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WhatsAppChannelTest extends TestCase
{
    use RefreshDatabase;

    public function test_channel_sends_payload(): void
    {
        Http::fake();

        config()->set('services.whatsapp.token', 'token');
        config()->set('services.whatsapp.phone_id', '12345');

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
                    'template_name' => 'test_template',
                    'parameters' => ['foo', 'bar'],
                ];
            }
        };

        $user->notify($notification);

        Http::assertSent(function ($request) {
            $data = $request->data();

            return $request->url() === 'https://graph.facebook.com/v18.0/'.config('services.whatsapp.phone_id').'/messages'
                && $data['messaging_product'] === 'whatsapp'
                && $data['type'] === 'template'
                && $data['template']['name'] === 'test_template'
                && $data['template']['components'][0]['parameters'][0]['text'] === 'foo'
                && $data['template']['components'][0]['parameters'][1]['text'] === 'bar';
        });
    }
}
