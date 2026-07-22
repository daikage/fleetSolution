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

        // Manager — can submit requests but cannot accept or decline
        User::updateOrCreate(
            ['email' => 'manager@fkgfleet.local'],
            [
                'name' => 'Fleet Manager',
                'password' => Hash::make('password'),
                'role' => 'manager',
            ]
        );

        // Admin (Yusuf) — can accept/decline requests ₦20,000 and below
        User::updateOrCreate(
            ['email' => 'yusuf@fkgfleet.local'],
            [
                'name' => 'Yusuf',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        // Super Admin (Sheriff) — can accept/decline requests above ₦20,000
        User::updateOrCreate(
            ['email' => 'sheriff@fkgfleet.local'],
            [
                'name' => 'Sheriff',
                'password' => Hash::make('password'),
                'role' => 'super_admin',
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

        $this->call([
            SettingsSeeder::class,
        ]);
    }
}
