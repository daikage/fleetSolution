<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    public function trips()
    {
        return $this->hasMany(Trip::class);
    }

    public function locations()
    {
        return $this->hasMany(Location::class);
    }

    public function maintenances()
    {
        return $this->hasMany(Maintenance::class);
    }

    public function latestLocation()
    {
        return $this->hasOne(Location::class)->latestOfMany();
    }

    public function currentTrip()
    {
        return $this->hasOne(Trip::class)->whereNull('end_time')->latestOfMany();
    }

    public function fuelLogs()
    {
        return $this->hasMany(FuelLog::class);
    }

    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function inspections()
    {
        return $this->hasMany(Inspection::class);
    }

    public function maintenanceSchedules()
    {
        return $this->hasMany(MaintenanceSchedule::class);
    }
}
