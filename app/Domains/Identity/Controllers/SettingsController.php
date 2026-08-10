<?php

namespace App\Domains\Identity\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = \App\Domains\Identity\Models\Setting::all()->pluck('value', 'key');
        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $request->validate([
            'tracker_type' => 'required|string|in:mobile_app,traccar,osmand,custom_iot',
            'map_provider' => 'required|string|in:map_libre,google_maps',
        ]);

        \App\Domains\Identity\Models\Setting::updateOrCreate(
            ['key' => 'tracker_type'],
            ['value' => $request->tracker_type]
        );

        \App\Domains\Identity\Models\Setting::updateOrCreate(
            ['key' => 'map_provider'],
            ['value' => $request->map_provider]
        );

        return response()->json(['message' => 'Settings updated successfully']);
    }
}
