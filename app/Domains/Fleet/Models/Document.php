<?php

namespace App\Domains\Fleet\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'is_archived' => 'boolean',
        ];
    }

    public function documentable()
    {
        return $this->morphTo();
    }
}
