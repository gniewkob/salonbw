<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\KontaktMessage;
use App\Models\Service;
use App\Models\ServiceVariant;
use App\Models\User;
use App\Notifications\NewMessageNotification;
use App\Notifications\StatusChangeNotification;
use App\Notifications\Channels\WhatsAppChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotificationsTest extends TestCase
{
    use RefreshDatabase;

    private function createService(): array
    {
        $service = Service::create(['name' => 'Test Service']);
        $variant = $service->variants()->create([
            'variant_name' => 'Basic',
            'duration_minutes' => 60,
            'price_pln' => 100,
        ]);
        return [$service, $variant];
    }

    public function test_status_change_notification_sent_on_update(): void
    {
        Notification::fake();

        [$service, $variant] = $this->createService();
        $user = User::factory()->create(['notification_preference' => 'email']);

        $appointment = Appointment::create([
            'user_id' => $user->id,
            'service_id' => $service->id,
            'service_variant_id' => $variant->id,
            'price_pln' => 100,
            'appointment_at' => now(),
            'status' => 'zaplanowana',
        ]);

        $appointment->update(['status' => 'odbyta']);

        Notification::assertSentTo($user, StatusChangeNotification::class);
    }

    public function test_new_message_notification_sent_when_admin_reply_created(): void
    {
        Notification::fake();

        $user = User::factory()->create(['notification_preference' => 'email']);
        $admin = User::factory()->create(['role' => 'admin', 'notification_preference' => 'email']);

        $parent = KontaktMessage::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'message' => 'Hello',
            'status' => 'nowa',
        ]);

        KontaktMessage::create([
            'user_id' => $user->id,
            'admin_id' => $admin->id,
            'name' => $admin->name,
            'email' => $admin->email,
            'message' => 'Reply',
            'reply_to_id' => $parent->id,
            'is_from_admin' => true,
            'is_read' => false,
            'status' => 'nowa',
        ]);

        Notification::assertSentTo($user, NewMessageNotification::class);
    }

    public function test_notification_channels_respect_preference(): void
    {
        $notification = new StatusChangeNotification(new Appointment());

        $emailUser = User::factory()->make(['notification_preference' => 'email']);
        $whatsAppUser = User::factory()->make(['notification_preference' => 'whatsapp']);
        $bothUser = User::factory()->make(['notification_preference' => 'both']);

        $this->assertSame(['mail'], $notification->via($emailUser));
        $this->assertSame([WhatsAppChannel::class], $notification->via($whatsAppUser));
        $this->assertSame(['mail', WhatsAppChannel::class], $notification->via($bothUser));
    }
}
