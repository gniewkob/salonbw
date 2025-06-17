<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FallbackRedirectTest extends TestCase
{
    use RefreshDatabase;

    public function test_invalid_url_redirects_user_to_dashboard(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($user)->get('/nonexistent');

        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_invalid_url_redirects_admin_to_calendar(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get('/some/invalid/path');

        $response->assertRedirect(route('admin.calendar', absolute: false));
    }

    public function test_invalid_url_redirects_guest_home(): void
    {
        $response = $this->get('/invalid');

        $response->assertRedirect('/');
    }
}

