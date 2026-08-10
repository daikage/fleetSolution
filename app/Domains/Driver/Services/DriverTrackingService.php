<?php

namespace App\Domains\Driver\Services;

use App\Domains\Driver\Models\Driver;
use App\Domains\Driver\Models\Trip;
use App\Domains\Telematics\Models\Location;
use App\Jobs\ProcessVehicleLocation;
use Exception;

class DriverTrackingService
{
    public function getDriver(int $userId)
    {
        $driver = Driver::where('user_id', $userId)->first();
        if (!$driver) {
            throw new Exception('Driver profile not found.', 404);
        }
        return $driver;
    }

    public function checkTrackingRequirement(int $userId): array
    {
        try {
            $driver = $this->getDriver($userId);
        } catch (Exception $e) {
            return [
                'should_track' => false,
                'message' => 'No driver profile found.',
            ];
        }

        $activeTrip = Trip::where('driver_id', $driver->id)
            ->whereNull('end_time')
            ->with('vehicle')
            ->latest()
            ->first();

        if (!$activeTrip) {
            return [
                'should_track' => false,
                'message' => 'No active trip assigned.',
                'driver_id' => $driver->id,
            ];
        }

        $recentPing = Location::where('vehicle_id', $activeTrip->vehicle_id)
            ->where('created_at', '>=', now()->subMinutes(5))
            ->exists();

        return [
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
        ];
    }

    public function reportStatus(int $userId, bool $isTracking): array
    {
        $driver = $this->getDriver($userId);

        $driver->update([
            'last_tracking_report' => now(),
            'tracking_status' => $isTracking ? 'active' : 'inactive',
        ]);

        $activeTrip = Trip::where('driver_id', $driver->id)
            ->whereNull('end_time')
            ->exists();

        $needsTracking = $activeTrip && !$isTracking;

        return [
            'success' => true,
            'needs_tracking' => $needsTracking,
            'message' => $needsTracking
                ? 'You have an active trip but tracking is off. Please start tracking immediately!'
                : 'Status recorded.',
        ];
    }

    public function processAutoPing(int $userId, float $latitude, float $longitude, ?float $speed): array
    {
        $driver = $this->getDriver($userId);

        $activeTrip = Trip::where('driver_id', $driver->id)
            ->whereNull('end_time')
            ->with('vehicle')
            ->latest()
            ->first();

        if (!$activeTrip || !$activeTrip->vehicle) {
            return [
                'accepted' => false,
                'message' => 'No active trip assigned. Location not recorded.',
            ];
        }

        $job = new ProcessVehicleLocation(
            $activeTrip->vehicle_id,
            $latitude,
            $longitude,
            (int) ($speed ?? 0)
        );
        $job->handle();

        return [
            'accepted' => true,
            'vehicle_id' => $activeTrip->vehicle_id,
            'trip_id' => $activeTrip->id,
            'message' => 'Location recorded for active trip.',
        ];
    }

    public function getActiveTrip(int $userId): array
    {
        try {
            $driver = $this->getDriver($userId);
        } catch (Exception $e) {
            return ['vehicle_id' => null, 'trip_id' => null];
        }

        $trip = Trip::where('driver_id', $driver->id)
            ->whereNull('end_time')
            ->latest()
            ->first();

        return [
            'vehicle_id' => $trip ? $trip->vehicle_id : null,
            'trip_id' => $trip ? $trip->id : null,
        ];
    }
}
