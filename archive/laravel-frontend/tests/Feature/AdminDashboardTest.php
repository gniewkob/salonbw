<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\ServiceVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_shows_nearest_three_appointments_and_monthly_stats(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create();
        $service = Service::factory()->create();
        $variant = ServiceVariant::factory()->for($service)->create();

        // Upcoming appointments
        $a1 = Appointment::factory()->for($user)->for($service)->for($variant)
            ->create(['appointment_at' => Carbon::now()->addDay()]);
        $a2 = Appointment::factory()->for($user)->for($service)->for($variant)
            ->create(['appointment_at' => Carbon::now()->addDays(2)]);
        $a3 = Appointment::factory()->for($user)->for($service)->for($variant)
            ->create(['appointment_at' => Carbon::now()->addDays(3)]);
        Appointment::factory()->for($user)->for($service)->for($variant)
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

        $response = $this->actingAs($admin)->get(route('admin.dashboard', absolute: false));
        $response->assertOk();

        $appointments = $response->viewData('upcomingAppointments');
        $this->assertEqualsCanonicalizing([
            $a1->id,
            $a2->id,
            $a3->id,
        ], $appointments->pluck('id')->all());

        $response->assertViewHas('completedThisMonth', 2);
        $response->assertViewHas('missedThisMonth', 1);
    }
}
