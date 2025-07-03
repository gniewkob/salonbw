<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\ServiceVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppointmentPendingTest extends TestCase
{
    use RefreshDatabase;

    private function setupData()
    {
        $user = User::factory()->create();
        $service = Service::create(['name' => 'Test']);
        $variant = $service->variants()->create([
            'variant_name' => 'V1',
            'duration_minutes' => 60,
            'price_pln' => 100,
        ]);
        return [$user, $service, $variant];
    }

    public function test_overlapping_requires_confirmation()
    {
        [$user, $service, $variant] = $this->setupData();
        Appointment::create([
            'user_id' => $user->id,
            'service_id' => $service->id,
            'service_variant_id' => $variant->id,
            'price_pln' => 100,
            'appointment_at' => now()->addDay()->setTime(10,0),
            'status' => 'zaplanowana',
        ]);

        $response = $this->actingAs($user)->post('/rezerwacje', [
            'service_variant_id' => $variant->id,
            'appointment_at' => now()->addDay()->setTime(10,0)->toDateTimeString(),
        ]);

        $response->assertSessionHasErrors('appointment_at');
        $this->assertSame(1, Appointment::count());
    }

    public function test_user_can_create_pending_when_confirmed()
    {
        [$user, $service, $variant] = $this->setupData();
        Appointment::create([
            'user_id' => $user->id,
            'service_id' => $service->id,
            'service_variant_id' => $variant->id,
            'price_pln' => 100,
            'appointment_at' => now()->addDay()->setTime(11,0),
            'status' => 'zaplanowana',
        ]);

        $response = $this->actingAs($user)->post('/rezerwacje', [
            'service_variant_id' => $variant->id,
            'appointment_at' => now()->addDay()->setTime(11,0)->toDateTimeString(),
            'allow_pending' => '1',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertSame(2, Appointment::count());
        $this->assertEquals('oczekuje', Appointment::orderByDesc('id')->first()->status);
    }
}
