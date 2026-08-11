<?php

namespace App\Domains\Telematics\Services;

use App\Domains\Identity\Models\Setting;
use App\Domains\Fleet\Models\Vehicle;
use App\Jobs\ProcessVehicleLocation;
use Illuminate\Support\Facades\Log;
use Exception;

class TelematicsService
{
    public function processMobileLocation(int $vehicleId, float $latitude, float $longitude, ?float $speed, ?string $userRole): void
    {
        $trackerType = Setting::where('key', 'tracker_type')->value('value') ?? 'mobile_app';

        if ($userRole === 'driver' && $trackerType !== 'mobile_app') {
            throw new Exception('Mobile app tracking is disabled in settings.', 400);
        }

        if (!in_array($trackerType, ['mobile_app', 'traccar', 'custom_iot'])) {
            throw new Exception('Current tracker setting does not support this endpoint.', 403);
        }

        $job = new ProcessVehicleLocation($vehicleId, $latitude, $longitude, (int) ($speed ?? 0));
        $job->handle();
    }

    public function processOsmAndLocation(int $vehicleId, float $latitude, float $longitude, ?float $speed, string $providedSecret): void
    {
        $trackerType = Setting::where('key', 'tracker_type')->value('value');
        
        if ($trackerType !== 'osmand') {
            throw new Exception('OsmAnd tracking is not enabled.', 403);
        }

        $sharedSecret = Setting::where('key', 'osmand_secret')->value('value');

        if (!$sharedSecret || $providedSecret !== $sharedSecret) {
            throw new Exception('Invalid or missing shared secret.', 403);
        }

        $job = new ProcessVehicleLocation($vehicleId, $latitude, $longitude, (int) ($speed ?? 0));
        $job->handle();
    }

    public function getLatestLocations(): array
    {
        return Vehicle::with(['latestLocation', 'currentTrip.driver.user'])->get()
            ->map(fn($v) => [
                'id' => $v->id,
                'latitude' => $v->latestLocation?->latitude ?? $v->latitude,
                'longitude' => $v->latestLocation?->longitude ?? $v->longitude,
                'speed' => $v->latestLocation?->speed ?? 0,
                'updated_at' => $v->latestLocation?->created_at,
                'driver' => $v->currentTrip && $v->currentTrip->driver && $v->currentTrip->driver->user
                    ? [
                        'id' => $v->currentTrip->driver->id,
                        'name' => $v->currentTrip->driver->user->name,
                        'license_no' => $v->currentTrip->driver->license_no,
                    ]
                    : null,
            ])->toArray();
    }
}
