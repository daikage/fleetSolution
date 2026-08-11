<?php

namespace App\Domains\Telematics\Models;

use App\Domains\Fleet\Models\Vehicle;


use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    protected $guarded = [];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
}
