<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\ServiceVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;
use Carbon\Carbon;

class AppointmentCreateTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_can_create_appointment(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $service = Service::factory()->create();
        $variant = ServiceVariant::factory()->for($service)->create();

        $time = Carbon::now()->addDay()->setTime(10, 0);

        $response = $this->actingAs($user)->post(
            route('appointments.store', absolute: false),
            [
                'service_variant_id' => $variant->id,
                'appointment_at' => $time->toDateTimeString(),
            ]
        );

        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertSame(1, Appointment::count());

        $appointment = Appointment::first();
        $this->assertSame($user->id, $appointment->user_id);
        $this->assertSame($service->id, $appointment->service_id);
        $this->assertSame($variant->id, $appointment->service_variant_id);
        $this->assertSame('zaplanowana', $appointment->status);

        Notification::assertNothingSent();
    }
}
