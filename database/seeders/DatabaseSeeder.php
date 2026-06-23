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
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@fleet.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        // Create a test Vehicle
        \App\Models\Vehicle::create([
            'make' => 'Ford',
            'model' => 'Transit Connect',
            'year' => 2023,
            'vin' => '1FTBR1ZC1PKA12345',
            'license_plate' => 'ABC-1234',
            'status' => 'active',
            'odometer' => 15000,
        ]);
    }
}
