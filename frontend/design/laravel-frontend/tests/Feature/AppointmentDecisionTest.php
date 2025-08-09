<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\User;
use App\Notifications\StatusChangeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AppointmentDecisionTest extends TestCase
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

    public function test_user_can_confirm_pending_appointment(): void
    {
        Notification::fake();

        [$service, $variant] = $this->createService();
        $user = User::factory()->create(['notification_preference' => 'email']);
        $admin = User::factory()->create(['role' => 'admin', 'notification_preference' => 'email']);

        $appointment = Appointment::create([
            'user_id' => $user->id,
            'service_id' => $service->id,
            'service_variant_id' => $variant->id,
            'price_pln' => 100,
            'appointment_at' => now(),
            'status' => 'proponowana',
        ]);

        $this->actingAs($user)
            ->patch(route('appointments.confirm', $appointment, absolute: false))
            ->assertRedirect(route('appointments.index', absolute: false));

        $this->assertSame('zaplanowana', $appointment->fresh()->status);
        Notification::assertSentTo($admin, StatusChangeNotification::class);
    }

    public function test_user_can_decline_pending_appointment(): void
    {
        Notification::fake();

        [$service, $variant] = $this->createService();
        $user = User::factory()->create(['notification_preference' => 'email']);
        $admin = User::factory()->create(['role' => 'admin', 'notification_preference' => 'email']);

        $appointment = Appointment::create([
            'user_id' => $user->id,
            'service_id' => $service->id,
            'service_variant_id' => $variant->id,
            'price_pln' => 100,
            'appointment_at' => now(),
            'status' => 'oczekuje',
        ]);

        $this->actingAs($user)
            ->patch(route('appointments.decline', $appointment, absolute: false))
            ->assertRedirect(route('appointments.index', absolute: false));

        $this->assertSame('odwołana', $appointment->fresh()->status);
        Notification::assertSentTo($admin, StatusChangeNotification::class);
    }

    public function test_user_cannot_modify_someone_elses_appointment(): void
    {
        [$service, $variant] = $this->createService();
        $user = User::factory()->create();
        $other = User::factory()->create();

        $appointment = Appointment::create([
            'user_id' => $other->id,
            'service_id' => $service->id,
            'service_variant_id' => $variant->id,
            'price_pln' => 100,
            'appointment_at' => now(),
            'status' => 'proponowana',
        ]);

        $this->actingAs($user)
            ->patch(route('appointments.confirm', $appointment, absolute: false))
            ->assertStatus(403);
    }
}
