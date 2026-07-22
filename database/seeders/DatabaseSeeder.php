<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create an Admin User
        User::updateOrCreate(
            ['email' => 'admin@fleet.com'],
            [
                'name' => 'Admin User',
                'password' => bcrypt('password'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        // Create a test Vehicle
        \App\Models\Vehicle::updateOrCreate(
            ['vin' => '1FTBR1ZC1PKA12345'],
            [
                'make' => 'Ford',
                'model' => 'Transit Connect',
                'year' => 2023,
                'license_plate' => 'ABC-1234',
                'status' => 'active',
                'odometer' => 15000,
            ]
        );

        $this->call([
            ReviewersSeeder::class,
        ]);
    }
}
