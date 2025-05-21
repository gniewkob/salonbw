<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceVariant extends Model
{
	use HasFactory;

	protected $fillable = [
		'service_id',
		'variant_name',
		'duration_minutes',
		'price_pln',
	];

	public function service()
	{
		return $this->belongsTo(Service::class);
	}
}