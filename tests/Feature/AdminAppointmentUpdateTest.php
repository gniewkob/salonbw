<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\ServiceVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class AdminAppointmentUpdateTest extends TestCase
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

    public function test_date_change_sets_status_to_proposed(): void
    {
        [$service, $variant] = $this->createService();
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create();

        $oldTime = Carbon::now()->addDay()->setTime(10, 0);
        $appointment = Appointment::create([
            'user_id' => $user->id,
            'service_id' => $service->id,
            'service_variant_id' => $variant->id,
            'price_pln' => 100,
            'appointment_at' => $oldTime,
            'status' => 'zaplanowana',
        ]);

        $newTime = $oldTime->copy()->addHour();

        $response = $this->actingAs($admin)->patch(
            route('admin.appointments.update', $appointment, absolute: false),
            [
                'user_id' => $user->id,
                'service_variant_id' => $variant->id,
                'appointment_at' => $newTime->toDateTimeString(),
                'status' => 'zaplanowana',
                'price_pln' => 100,
                'discount_percent' => 0,
                'note_user' => '',
                'service_description' => '',
                'products_used' => '',
            ]
        );

        $response->assertOk();
        $appointment->refresh();

        $this->assertSame('proponowana', $appointment->status);
        $this->assertTrue($appointment->appointment_at->eq($newTime));
    }
}
