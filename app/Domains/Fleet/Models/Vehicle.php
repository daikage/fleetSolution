<?php

namespace App\Domains\Fleet\Models;

use App\Domains\Driver\Models\Trip;
use App\Domains\Telematics\Models\Location;
use App\Domains\Maintenance\Models\Maintenance;
use App\Domains\Telematics\Models\FuelLog;
use App\Domains\Maintenance\Models\Inspection;
use App\Domains\Maintenance\Models\MaintenanceSchedule;
use App\Domains\Maintenance\Models\MaintenanceSchedule;
use App\Domains\Identity\Models\Department;
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

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($vehicle) {
            if (empty($vehicle->vehicle_id)) {
                $latest = static::orderBy('id', 'desc')->first();
                $nextId = $latest ? $latest->id + 1 : 1;
                $vehicle->vehicle_id = 'veh' . str_pad($nextId, 3, '0', STR_PAD_LEFT);
            }
        });
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
        return $this->hasOne(Trip::class)->whereNull('end_time')->where('status', 'active')->latestOfMany();
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

    public function department()
    {
        return $this->belongsTo(Department::class);
    }
}
