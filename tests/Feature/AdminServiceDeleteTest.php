<?php

namespace Tests\Feature;

use App\Models\Service;
use App\Models\ServiceVariant;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminServiceDeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_cannot_delete_service_with_appointments(): void
    {
        $service = Service::factory()->create();
        $variant = ServiceVariant::factory()->for($service)->create();
        $client = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);

        Appointment::factory()->for($client)->for($service)->for($variant)->create();

        $response = $this->actingAs($admin)->delete(route('admin.services.destroy', $service, absolute: false));

        $response->assertSessionHasErrors('service');
        $this->assertNotNull($service->fresh());
    }
}
