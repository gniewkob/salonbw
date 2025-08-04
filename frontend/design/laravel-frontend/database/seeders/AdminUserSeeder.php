<?php

// database/seeders/AdminUserSeeder.php
// Always hash seeded passwords. Hash::make uses bcrypt; explicitly set rounds
// so future updates don't accidentally store plaintext values.
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
                                // Hash password with bcrypt using 10 rounds
                                'password' => Hash::make('SuperSecureHasło!123', ['rounds' => 10]),
                                'role' => 'admin',
                        ]
                );
        }
}
