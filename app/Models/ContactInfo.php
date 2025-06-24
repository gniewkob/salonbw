<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContactInfo extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'contact_info';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'salon_name',
        'address_line1',
        'address_line2',
        'city',
        'postal_code',
        'phone',
        'email',
        'description',
        'working_hours',
        'facebook_url',
        'instagram_url',
        'google_maps_url',
        'latitude',
        'longitude',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'working_hours' => 'array',
    ];

    /**
     * Get the default contact information or create if not exists.
     *
     * @return \App\Models\ContactInfo
     */
    public static function getDefault()
    {
        $contactInfo = self::first();
        
        if (!$contactInfo) {
            $contactInfo = self::create([
                'salon_name' => 'Salon Beauty & Wellness',
                'address_line1' => 'ul. Przykładowa 123',
                'city' => 'Warszawa',
                'postal_code' => '00-001',
                'phone' => '+48 123 456 789',
                'email' => 'kontakt@salon-bw.pl',
                'google_maps_url' => 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2563.0658784063153!2d18.91093751598082!3d50.34623847946937!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47113061f0f77f11%3A0x39e236ec244bcabb!2sBytom!5e0!3m2!1spl!2spl!4v1618312782107!5m2!1spl!2spl',
                'latitude' => 50.346238,
                'longitude' => 18.910938,
                'working_hours' => [
                    'monday' => ['09:00', '18:00'],
                    'tuesday' => ['09:00', '18:00'],
                    'wednesday' => ['09:00', '18:00'],
                    'thursday' => ['09:00', '18:00'],
                    'friday' => ['09:00', '18:00'],
                    'saturday' => ['09:00', '16:00'],
                    'sunday' => null,
                ],
            ]);
        }

        // Ensure existing record has coordinates
        elseif (is_null($contactInfo->latitude) || is_null($contactInfo->longitude)) {
            $contactInfo->update([
                'latitude' => 50.346238,
                'longitude' => 18.910938,
            ]);
        }
        
        return $contactInfo;
    }
}
