<?php

namespace App\Domains\Maintenance\Models;

use Illuminate\Database\Eloquent\Model;

class MaintenanceVendor extends Model
{
    protected $guarded = [];

    public function maintenance()
    {
        return $this->belongsTo(Maintenance::class);
    }
}
