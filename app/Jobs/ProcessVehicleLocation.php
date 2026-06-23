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
        $location = Location::create([
            'vehicle_id' => $this->vehicleId,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'speed' => $this->speed,
        ]);

        // Broadcast event
        broadcast(new VehicleLocationUpdated($location));
    }
}
