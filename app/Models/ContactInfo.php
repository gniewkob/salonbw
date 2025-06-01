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
        
        return $contactInfo;
    }
}
