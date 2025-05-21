<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KontaktMessage extends Model
{
	protected $fillable = ['name', 'email', 'phone', 'message'];
}
