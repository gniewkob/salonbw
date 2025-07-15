<?php

namespace Tests\Feature;

use App\Models\Appointment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppointmentGuestTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_create_appointment(): void
    {
        $response = $this->postJson('/rezerwacje', []);

        $response->assertUnauthorized();
        $this->assertSame(0, Appointment::count());
    }
}

