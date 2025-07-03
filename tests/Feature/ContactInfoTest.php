<?php

namespace Tests\Feature;

use App\Models\ContactInfo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactInfoTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_default_sets_missing_coordinates(): void
    {
        ContactInfo::create([
            'salon_name' => 'Test Salon',
            'address_line1' => 'Address 1',
            'city' => 'City',
            'postal_code' => '00-000',
            'phone' => '123456789',
            'email' => 'test@example.com',
            'latitude' => null,
            'longitude' => null,
        ]);

        $contactInfo = ContactInfo::getDefault();

        $this->assertNotNull($contactInfo->latitude);
        $this->assertNotNull($contactInfo->longitude);
    }

    public function test_formatted_working_hours_returns_correct_data(): void
    {
        $info = ContactInfo::create([
            'salon_name' => 'Salon',
            'address_line1' => 'A1',
            'city' => 'City',
            'postal_code' => '00-000',
            'phone' => '123',
            'email' => 'a@b.com',
            'working_hours' => [
                'monday' => ['08:00', '16:00'],
                'wednesday' => ['10:00', '18:00'],
            ],
        ]);

        $result = $info->formattedWorkingHours();

        $this->assertSame('08:00', $result['start']);
        $this->assertSame('18:00', $result['end']);
        $this->assertEquals([1,3], $result['daysOfWeek']);
    }

    public function test_working_hours_endpoint_returns_hours(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $info = ContactInfo::getDefault();
        $info->update([
            'working_hours' => [
                'monday' => ['07:00', '15:00'],
            ],
        ]);

        $response = $this->actingAs($admin)->getJson(route('admin.appointments.workingHours', absolute: false));
        $response->assertOk();
        $response->assertJson([
            'start' => '07:00',
            'end' => '15:00',
            'daysOfWeek' => [1],
        ]);
    }
}
