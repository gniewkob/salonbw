<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Blocker;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class AppointmentBusyTimesTest extends TestCase
{
    use RefreshDatabase;

    public function test_busy_times_include_blockers(): void
    {
        $user = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);

        $service = Service::create(['name' => 'Test']);
        $variant = $service->variants()->create([
            'variant_name' => 'Basic',
            'duration_minutes' => 60,
            'price_pln' => 100,
        ]);

        $appointmentTime = Carbon::create(2025, 6, 10, 10, 0);
        Appointment::create([
            'user_id' => $user->id,
            'service_id' => $service->id,
            'service_variant_id' => $variant->id,
            'price_pln' => 100,
            'appointment_at' => $appointmentTime,
            'status' => 'zaplanowana',
        ]);

        $blockerStart = Carbon::create(2025, 6, 10, 13, 0);
        Blocker::create([
            'admin_id' => $admin->id,
            'starts_at' => $blockerStart,
            'ends_at' => $blockerStart->copy()->addHour(),
        ]);

        $response = $this->actingAs($user)->getJson(route('appointments.busy', absolute: false));

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertCount(2, $data);
        $starts = array_map(fn ($s) => Carbon::parse($s)->setTimezone('Europe/Warsaw')->format('Y-m-d H:i:s'), array_column($data, 'start'));
        $this->assertContains($appointmentTime->format('Y-m-d H:i:s'), $starts);
        $this->assertContains($blockerStart->format('Y-m-d H:i:s'), $starts);
    }
}
