<?php

namespace App\Domains\Driver\Models;

use App\Domains\Identity\Models\User;
use App\Domains\Telematics\Models\FuelLog;
use App\Domains\Maintenance\Models\Inspection;


use App\Domains\Fleet\Models\Document;
use Illuminate\Database\Eloquent\Model;

class Driver extends Model
{
    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function trips()
    {
        return $this->hasMany(Trip::class);
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
}
