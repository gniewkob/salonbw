<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = ['name', 'description'];

    public function variants()
    {
        return $this->hasMany(ServiceVariant::class);
    }
}