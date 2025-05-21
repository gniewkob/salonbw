<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Service;
use App\Models\ServiceVariant;

class ServiceSeeder extends Seeder
{
	public function run()
	{
		$data = [
			[
				'name' => 'Botox na włosy',
				'variants' => [
					['variant_name' => 'Włosy krótkie', 'duration_minutes' => 120, 'price_pln' => 300],
					['variant_name' => 'Włosy średnie', 'duration_minutes' => 120, 'price_pln' => 350],
					['variant_name' => 'Włosy długie', 'duration_minutes' => 180, 'price_pln' => 400],
					['variant_name' => 'Włosy bardzo długie', 'duration_minutes' => 180, 'price_pln' => 450],
				],
			],
			[
				'name' => 'Koloryzacja',
				'variants' => [
					['variant_name' => 'Włosy krótkie', 'duration_minutes' => 180, 'price_pln' => 240],
					['variant_name' => 'Włosy średnie', 'duration_minutes' => 180, 'price_pln' => 250],
					['variant_name' => 'Włosy długie', 'duration_minutes' => 180, 'price_pln' => 270],
					['variant_name' => 'Włosy bardzo długie', 'duration_minutes' => 210, 'price_pln' => 280],
				],
			],
			[
				'name' => 'AirTouch',
				'variants' => [
					['variant_name' => 'Włosy krótkie', 'duration_minutes' => 240, 'price_pln' => 450],
					['variant_name' => 'Włosy średnie', 'duration_minutes' => 240, 'price_pln' => 550],
					['variant_name' => 'Włosy długie', 'duration_minutes' => 270, 'price_pln' => 600],
					['variant_name' => 'Włosy bardzo długie', 'duration_minutes' => 300, 'price_pln' => 650],
				],
			],
			[
				'name' => 'Trwała ondulacja',
				'variants' => [
					['variant_name' => 'Włosy krótkie', 'duration_minutes' => 90, 'price_pln' => 180],
					['variant_name' => 'Włosy średnie', 'duration_minutes' => 120, 'price_pln' => 210],
					['variant_name' => 'Włosy długie', 'duration_minutes' => 150, 'price_pln' => 240],
				],
			],
			[
				'name' => 'Strzyżenie damskie',
				'variants' => [
					['variant_name' => 'Włosy krótkie', 'duration_minutes' => 45, 'price_pln' => 90],
					['variant_name' => 'Włosy średnie', 'duration_minutes' => 60, 'price_pln' => 100],
					['variant_name' => 'Włosy długie', 'duration_minutes' => 60, 'price_pln' => 120],
				],
			],
			[
				'name' => 'Strzyżenie męskie',
				'variants' => [
					['variant_name' => 'Standard', 'duration_minutes' => 30, 'price_pln' => 60],
					['variant_name' => 'Broda', 'duration_minutes' => 15, 'price_pln' => 40],
				],
			],
			[
				'name' => 'Modelowanie damskie',
				'variants' => [
					['variant_name' => 'Włosy krótkie', 'duration_minutes' => 30, 'price_pln' => 60],
					['variant_name' => 'Włosy średnie', 'duration_minutes' => 45, 'price_pln' => 70],
					['variant_name' => 'Włosy długie', 'duration_minutes' => 60, 'price_pln' => 90],
				],
			],
			[
				'name' => 'Fryzura ślubna',
				'variants' => [
					['variant_name' => 'Próbna', 'duration_minutes' => 90, 'price_pln' => 150],
					['variant_name' => 'Docelowa', 'duration_minutes' => 120, 'price_pln' => 200],
				],
			],
			[
				'name' => 'Dermabrazja',
				'variants' => [
					['variant_name' => 'Standard', 'duration_minutes' => 30, 'price_pln' => 80],
				],
			],
			[
				'name' => 'Przedłużanie włosów',
				'variants' => [
					['variant_name' => 'Hair Extensions', 'duration_minutes' => 240, 'price_pln' => 1000],
				],
			],
		];

		foreach ($data as $serviceData) {
			$service = Service::create([
				'name' => $serviceData['name'],
				'description' => null,
			]);

			foreach ($serviceData['variants'] as $variant) {
				$service->variants()->create($variant);
			}
		}
	}
}