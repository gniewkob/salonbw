<?php

// database/seeders/AdminUserSeeder.php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
	public function run()
	{
		User::updateOrCreate(
			['email' => 'admin@salon-bw.pl'],
			[
				'name' => 'Admin',
				'password' => Hash::make('SuperSecureHasło!123'),
				'role' => 'admin',
			]
		);
	}
}
