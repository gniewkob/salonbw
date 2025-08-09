<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\User;
use App\Notifications\StatusChangeNotification;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AppointmentRescheduleTest extends TestCase
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

    public function test_rescheduling_sets_status_to_proponowana_and_sends_notification(): void
    {
        Notification::fake();

        [$service, $variant] = $this->createService();
        $user = User::factory()->create(['notification_preference' => 'email']);
        $admin = User::factory()->create(['role' => 'admin', 'notification_preference' => 'email']);

        $time = Carbon::create(2025, 6, 5, 10, 0);

        $appointment = Appointment::create([
            'user_id' => $user->id,
            'service_id' => $service->id,
            'service_variant_id' => $variant->id,
            'price_pln' => 100,
            'appointment_at' => $time,
            'status' => 'zaplanowana',
        ]);

        $newTime = $time->copy()->addHour();

        $this->actingAs($admin)->post(route('admin.appointments.updateTime', [$appointment], false), [
            'appointment_at' => $newTime->toDateTimeString(),
        ])->assertJson(['success' => true]);

        $appointment->refresh();
        $this->assertSame('proponowana', $appointment->status);
        $this->assertTrue($appointment->appointment_at->equalTo($newTime));

        Notification::assertSentTo($user, StatusChangeNotification::class);
    }
}
