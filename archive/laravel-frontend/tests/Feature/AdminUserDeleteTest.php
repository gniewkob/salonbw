<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserDeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_cannot_delete_self(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this
            ->actingAs($admin)
            ->from('/admin/users')
            ->delete(route('admin.users.destroy', $admin, absolute: false));

        $response->assertSessionHasErrors('user');
        $this->assertNotNull($admin->fresh());
    }
}
