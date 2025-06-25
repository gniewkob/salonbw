<?php

namespace Tests\Feature;

use App\Models\ContactInfo;
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
}
