<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\ServiceVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class AppointmentPastDateTest extends TestCase
{
    use RefreshDatabase;

    public function test_appointment_date_must_be_in_future(): void
    {
        $user = User::factory()->create();
        $service = Service::factory()->create();
        $variant = ServiceVariant::factory()->for($service)->create();

        $past = Carbon::now()->subDay()->setTime(10, 0);

        $response = $this->actingAs($user)->post(
            route('appointments.store', absolute: false),
            [
                'service_variant_id' => $variant->id,
                'appointment_at' => $past->toDateTimeString(),
            ]
        );

        $response->assertSessionHasErrors('appointment_at');
        $this->assertSame(0, Appointment::count());
    }
}
