<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    protected $guarded = [];

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
}
