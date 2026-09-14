<?php

namespace Database\Seeders;

use App\Domains\Identity\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Setting::updateOrCreate(
            ['key' => 'tracker_type'],
            ['value' => 'mobile_app']
        );

        Setting::updateOrCreate(
            ['key' => 'map_provider'],
            ['value' => 'map_libre']
        );
    }
}
