<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\ServiceVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class AdminAppointmentAdminUserTest extends TestCase
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

    public function test_store_rejects_admin_user(): void
    {
        [$service, $variant] = $this->createService();
        $admin = User::factory()->create(['role' => 'admin']);
        $otherAdmin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(
            route('admin.appointments.store', absolute: false),
            [
                'user_id' => $otherAdmin->id,
                'service_variant_id' => $variant->id,
                'appointment_at' => Carbon::now()->addDay()->toDateTimeString(),
                'price_pln' => 100,
                'discount_percent' => 0,
                'note_user' => '',
                'service_description' => '',
                'products_used' => '',
            ]
        );

        $response->assertSessionHasErrors('user_id');
    }

    public function test_update_rejects_admin_user(): void
    {
        [$service, $variant] = $this->createService();
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create();
        $otherAdmin = User::factory()->create(['role' => 'admin']);

        $appointment = Appointment::create([
            'user_id' => $user->id,
            'service_id' => $service->id,
            'service_variant_id' => $variant->id,
            'price_pln' => 100,
            'appointment_at' => Carbon::now()->addDay(),
            'status' => 'zaplanowana',
        ]);

        $response = $this->actingAs($admin)->patch(
            route('admin.appointments.update', $appointment, absolute: false),
            [
                'user_id' => $otherAdmin->id,
                'service_variant_id' => $variant->id,
                'appointment_at' => Carbon::now()->addDays(2)->toDateTimeString(),
                'status' => 'zaplanowana',
                'price_pln' => 100,
                'discount_percent' => 0,
                'note_user' => '',
                'service_description' => '',
                'products_used' => '',
            ]
        );

        $response->assertSessionHasErrors('user_id');
    }
}
