<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\ServiceVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileDeleteWithAppointmentsTest extends TestCase
{
    use RefreshDatabase;

    public function test_account_deletion_fails_when_user_has_appointments(): void
    {
        $user = User::factory()->create();
        $service = Service::factory()->create();
        $variant = ServiceVariant::factory()->for($service)->create();
        Appointment::factory()->for($user)->for($service)->for($variant)->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->delete('/profile', [
                'password' => 'password',
            ]);

        $response->assertSessionHasErrors('user');
        $this->assertNotNull($user->fresh());
    }
}
