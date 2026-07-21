<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class ReviewersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
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

        User::updateOrCreate(
            ['email' => 'admin@fkgfleet.local'],
            [
                'name' => 'Admin',
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

        User::updateOrCreate(
            ['email' => 'superadmin@fkgfleet.local'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'role' => 'super_admin',
            ]
        );
    }
}
