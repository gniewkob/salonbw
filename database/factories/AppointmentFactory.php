<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\ServiceVariant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AppointmentFactory extends Factory
{
    protected $model = Appointment::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'service_id' => Service::factory(),
            'service_variant_id' => ServiceVariant::factory(),
            'price_pln' => 100,
            'discount_percent' => 0,
            'appointment_at' => $this->faker->dateTimeBetween('-1 month', '+1 month'),
            'status' => 'zaplanowana',
        ];
    }
}
