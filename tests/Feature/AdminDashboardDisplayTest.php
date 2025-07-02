<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\ServiceVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class AdminDashboardDisplayTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_displays_next_three_appointments_and_stats(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create(['name' => 'Alice']);
        $user2 = User::factory()->create(['name' => 'Bob']);
        $service = Service::factory()->create();
        $variant = ServiceVariant::factory()->for($service)->create();

        // Upcoming appointments
        $a1 = Appointment::factory()->for($user)->for($service)->for($variant)
            ->create(['appointment_at' => Carbon::now()->addDay()]);
        $a2 = Appointment::factory()->for($user2)->for($service)->for($variant)
            ->create(['appointment_at' => Carbon::now()->addDays(2)]);
        $a3 = Appointment::factory()->for($user)->for($service)->for($variant)
            ->create(['appointment_at' => Carbon::now()->addDays(3)]);
        $a4 = Appointment::factory()->for($user)->for($service)->for($variant)
            ->create(['appointment_at' => Carbon::now()->addDays(4)]);

        // Stats for current month
        Appointment::factory()->for($user)->for($service)->for($variant)
            ->create([
                'appointment_at' => Carbon::now()->startOfMonth()->addHours(5),
                'status' => 'odbyta',
            ]);
        Appointment::factory()->for($user)->for($service)->for($variant)
            ->create([
                'appointment_at' => Carbon::now()->startOfMonth()->addHours(6),
                'status' => 'odbyta',
            ]);
        Appointment::factory()->for($user)->for($service)->for($variant)
            ->create([
                'appointment_at' => Carbon::now()->startOfMonth()->addHours(7),
                'status' => 'nieodbyta',
            ]);

        $response = $this->actingAs($admin)
            ->get(route('admin.dashboard', absolute: false));

        $response->assertOk();
        $response->assertSee($a1->appointment_at->format('d.m.Y H:i'));
        $response->assertSee($a2->appointment_at->format('d.m.Y H:i'));
        $response->assertSee($a3->appointment_at->format('d.m.Y H:i'));
        $response->assertDontSee($a4->appointment_at->format('d.m.Y H:i'));
        $response->assertSee('Odbyte: 2');
        $response->assertSee('Nieodbyte: 1');
    }
}
