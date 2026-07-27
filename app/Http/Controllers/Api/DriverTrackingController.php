<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DriverTrackingController extends Controller
{
    /**
     * Check if the driver has an active trip and should be tracking.
     * The driver app calls this periodically to enforce tracking.
     */
    public function shouldTrack(Request $request)
    {
        $user = $request->user();
        $driver = \App\Models\Driver::where('user_id', $user->id)->first();

        if (!$driver) {
            return response()->json([
                'should_track' => false,
                'message' => 'No driver profile found.',
            ]);
        }

        $activeTrip = \App\Models\Trip::where('driver_id', $driver->id)
            ->whereNull('end_time')
            ->with('vehicle')
            ->latest()
            ->first();

        if (!$activeTrip) {
            return response()->json([
                'should_track' => false,
                'message' => 'No active trip assigned.',
                'driver_id' => $driver->id,
            ]);
        }

        // Check if we've received any location pings recently (within last 5 minutes)
        $recentPing = \App\Models\Location::where('vehicle_id', $activeTrip->vehicle_id)
            ->where('created_at', '>=', now()->subMinutes(5))
            ->exists();

        return response()->json([
            'should_track' => true,
            'trip_id' => $activeTrip->id,
            'vehicle_id' => $activeTrip->vehicle_id,
            'vehicle' => $activeTrip->vehicle ? [
                'id' => $activeTrip->vehicle->id,
                'make' => $activeTrip->vehicle->make,
                'model' => $activeTrip->vehicle->model,
                'license_plate' => $activeTrip->vehicle->license_plate,
            ] : null,
            'is_tracking_active' => $recentPing,
            'message' => $recentPing
                ? 'Tracking is active. Keep it running.'
                : 'No recent location pings detected. Please start tracking immediately.',
            'driver_id' => $driver->id,
        ]);
    }

    /**
     * The driver app reports its current tracking status.
     * This helps the server detect if a driver stopped tracking.
     */
    public function reportStatus(Request $request)
    {
        $request->validate([
            'is_tracking' => 'required|boolean',
            'location_enabled' => 'boolean',
            'battery_optimization_disabled' => 'boolean',
        ]);

        $user = $request->user();
        $driver = \App\Models\Driver::where('user_id', $user->id)->first();

        if (!$driver) {
            return response()->json(['error' => 'Driver not found'], 404);
        }

        $driver->update([
            'last_tracking_report' => now(),
            'tracking_status' => $request->is_tracking ? 'active' : 'inactive',
        ]);

        // If driver reports not tracking but has an active trip, warn them
        $activeTrip = \App\Models\Trip::where('driver_id', $driver->id)
            ->whereNull('end_time')
            ->exists();

        $needsTracking = $activeTrip && !$request->is_tracking;

        return response()->json([
            'success' => true,
            'needs_tracking' => $needsTracking,
            'message' => $needsTracking
                ? 'You have an active trip but tracking is off. Please start tracking immediately!'
                : 'Status recorded.',
        ]);
    }

    /**
     * Process location ping - if driver has active trip, auto-register even
     * if they didn't manually "start tracking" on the app.
     */
    public function autoPing(Request $request)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'speed' => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = $request->user();
        $driver = \App\Models\Driver::where('user_id', $user->id)->first();

        if (!$driver) {
            return response()->json(['error' => 'Driver not found'], 404);
        }

        // Find active trip for this driver
        $activeTrip = \App\Models\Trip::where('driver_id', $driver->id)
            ->whereNull('end_time')
            ->with('vehicle')
            ->latest()
            ->first();

        if (!$activeTrip || !$activeTrip->vehicle) {
            return response()->json([
                'accepted' => false,
                'message' => 'No active trip assigned. Location not recorded.',
            ]);
        }

        // Process the location ping regardless of manual tracking state
        $job = new \App\Jobs\ProcessVehicleLocation(
            $activeTrip->vehicle_id,
            $request->latitude,
            $request->longitude,
            (int) ($request->speed ?? 0)
        );
        $job->handle();

        return response()->json([
            'accepted' => true,
            'vehicle_id' => $activeTrip->vehicle_id,
            'trip_id' => $activeTrip->id,
            'message' => 'Location recorded for active trip.',
        ]);
    }
}