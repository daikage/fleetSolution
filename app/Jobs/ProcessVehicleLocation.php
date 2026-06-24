<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Location;
use App\Events\VehicleLocationUpdated;

class ProcessVehicleLocation implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $vehicleId;
    public $latitude;
    public $longitude;
    public $speed;

    /**
     * Create a new job instance.
     */
    public function __construct($vehicleId, $latitude, $longitude, $speed)
    {
        $this->vehicleId = $vehicleId;
        $this->latitude = $latitude;
        $this->longitude = $longitude;
        $this->speed = $speed;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $lastLocation = Location::where('vehicle_id', $this->vehicleId)->latest()->first();
        
        $harshBraking = false;
        $rapidAcceleration = false;

        if ($lastLocation) {
            $speedDiff = $this->speed - $lastLocation->speed;
            if ($speedDiff < -30) { // arbitrary threshold for harsh braking (e.g. drop of 30km/h)
                $harshBraking = true;
            } elseif ($speedDiff > 30) { // rapid acceleration
                $rapidAcceleration = true;
            }
        }

        $location = Location::create([
            'vehicle_id' => $this->vehicleId,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'speed' => $this->speed,
            'harsh_braking' => $harshBraking,
            'rapid_acceleration' => $rapidAcceleration,
        ]);

        // Check Geofences
        $geofences = \App\Models\Geofence::where('type', 'restricted')->get();
        foreach ($geofences as $geofence) {
            $earthRadius = 6371000; // in meters
            $latFrom = deg2rad((float)$geofence->latitude);
            $lonFrom = deg2rad((float)$geofence->longitude);
            $latTo = deg2rad((float)$this->latitude);
            $lonTo = deg2rad((float)$this->longitude);

            $latDelta = $latTo - $latFrom;
            $lonDelta = $lonTo - $lonFrom;

            $a = sin($latDelta / 2) * sin($latDelta / 2) +
                 cos($latFrom) * cos($latTo) *
                 sin($lonDelta / 2) * sin($lonDelta / 2);
            $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
            $distance = $earthRadius * $c;

            if ($distance <= $geofence->radius_meters) {
                \Illuminate\Support\Facades\Log::warning("Vehicle {$this->vehicleId} entered restricted geofence {$geofence->name}!");
            }
        }

        // Broadcast event
        broadcast(new VehicleLocationUpdated($location));
    }
}
