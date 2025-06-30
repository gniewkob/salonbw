<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Coupon;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CouponApplyTest extends TestCase
{
    use RefreshDatabase;

    private function setupData()
    {
        $user = User::factory()->create();
        $service = Service::create(['name' => 'Test']);
        $variant = $service->variants()->create([
            'variant_name' => 'V1',
            'duration_minutes' => 60,
            'price_pln' => 100,
        ]);
        return [$user, $variant];
    }

    public function test_valid_coupon_applies_discount()
    {
        [$user, $variant] = $this->setupData();
        $coupon = Coupon::create([
            'code' => 'SAVE20',
            'discount_percent' => 20,
            'usage_limit' => 5,
        ]);

        $this->actingAs($user)->post('/rezerwacje', [
            'service_variant_id' => $variant->id,
            'appointment_at' => now()->addDay()->toDateTimeString(),
            'coupon_code' => 'SAVE20',
        ])->assertRedirect('/dashboard');

        $appt = Appointment::first();
        $this->assertSame($coupon->id, $appt->coupon_id);
        $this->assertSame(20, $appt->discount_percent);
        $this->assertSame(80, $appt->price_pln);
        $this->assertSame(1, $coupon->fresh()->used_count);
    }

    public function test_expired_coupon_is_rejected()
    {
        [$user, $variant] = $this->setupData();
        Coupon::create([
            'code' => 'OLD',
            'discount_percent' => 10,
            'expires_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($user)->post('/rezerwacje', [
            'service_variant_id' => $variant->id,
            'appointment_at' => now()->addDay()->toDateTimeString(),
            'coupon_code' => 'OLD',
        ]);

        $response->assertSessionHasErrors('coupon_code');
        $this->assertSame(0, Appointment::count());
    }
}
