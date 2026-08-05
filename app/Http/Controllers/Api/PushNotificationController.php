<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Driver;
use App\Notifications\ForceStartTracking;

class PushNotificationController extends Controller
{
    /**
     * Send a push notification to force-start tracking on a driver's device.
     */
    public function forceStart(Request $request)
    {
        // Only admin and superadmin can force-start tracking
        $user = $request->user();
        $role = $user->role;
        if (!in_array($role, ['manager', 'admin', 'superadmin', 'super_admin'])) {
            return response()->json(['error' => 'Unauthorized. Only manager/admin/superadmin can force-start tracking.'], 403);
        }

        $request->validate([
            'driver_id' => 'required|exists:drivers,id',
        ]);

        $driver = Driver::with('user')->findOrFail($request->driver_id);

        if (!$driver->user || !$driver->user->push_token) {
            return response()->json([
                'success' => false,
                'message' => 'Driver has no push token registered. They need to open the app at least once.'
            ], 404);
        }

        // Send push notification via Expo
        $driver->notify(new ForceStartTracking($driver));

        return response()->json([
            'success' => true,
            'message' => "Push notification sent to {$driver->user->name}."
        ]);
    }

    /**
     * Register or update a driver's push token (called from mobile app).
     */
    public function registerToken(Request $request)
    {
        $request->validate([
            'push_token' => 'required|string',
        ]);

        $user = $request->user();

        $user->update([
            'push_token' => $request->push_token,
            'push_token_updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Push token registered successfully.'
        ]);
    }
}