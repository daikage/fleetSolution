<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\Setting::updateOrCreate(
            ['key' => 'tracker_type'],
            ['value' => 'mobile_app']
        );

        \App\Models\Setting::updateOrCreate(
            ['key' => 'map_provider'],
            ['value' => 'map_libre']
        );
    }
}
