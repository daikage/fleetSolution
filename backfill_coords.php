<?php
$vehicles = \App\Domains\Fleet\Models\Vehicle::whereNull('latitude')->orWhereNull('longitude')->get();
foreach($vehicles as $vehicle) {
    $baseLoc = strtolower(trim($vehicle->base_location ?? ''));
    if (str_contains($baseLoc, 'lagos')) {
        $lat = 6.5244 + (rand(-100, 100) / 10000);
        $lng = 3.3792 + (rand(-100, 100) / 10000);
    } elseif (str_contains($baseLoc, 'abuja')) {
        $lat = 9.0765 + (rand(-100, 100) / 10000);
        $lng = 7.3986 + (rand(-100, 100) / 10000);
    } elseif (str_contains($baseLoc, 'ibadan')) {
        $lat = 7.3775 + (rand(-100, 100) / 10000);
        $lng = 3.9470 + (rand(-100, 100) / 10000);
    } else {
        $lat = 9.0820 + (rand(-500, 500) / 10000);
        $lng = 8.6753 + (rand(-500, 500) / 10000);
    }
    $vehicle->update(['latitude' => $lat, 'longitude' => $lng]);
}
echo 'Updated ' . $vehicles->count() . ' vehicles.';
