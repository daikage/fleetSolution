<?php

namespace App\Domains\Identity\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Domains\Fleet\Models\Vehicle;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
    ];

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class);
    }
}
