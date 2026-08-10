<?php

namespace App\Domains\Telematics\Models;

use App\Domains\Fleet\Models\Vehicle;
use App\Domains\Driver\Models\Driver;
use App\Domains\Identity\Models\User;


use Illuminate\Database\Eloquent\Model;

class FuelLog extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
