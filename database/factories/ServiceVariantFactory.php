<?php

namespace Database\Factories;

use App\Models\ServiceVariant;
use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

class ServiceVariantFactory extends Factory
{
    protected $model = ServiceVariant::class;

    public function definition(): array
    {
        return [
            'service_id' => Service::factory(),
            'variant_name' => $this->faker->word(),
            'duration_minutes' => 60,
            'price_pln' => 100,
        ];
    }
}
