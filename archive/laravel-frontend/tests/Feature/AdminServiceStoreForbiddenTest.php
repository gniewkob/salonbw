<?php

namespace Tests\Feature;

use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminServiceStoreForbiddenTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_cannot_create_service(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('admin.services.store', absolute: false), [
            'name' => 'Test Service',
            'description' => 'Sample description',
        ]);

        $response->assertStatus(403);
        $this->assertSame(0, Service::count());
    }
}
