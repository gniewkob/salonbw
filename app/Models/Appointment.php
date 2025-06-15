<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $fillable = [
        'user_id',
        'service_id',
        'service_variant_id',
        'price_pln',
        'discount_percent',
        'appointment_at',
        'status',
        'note_client',
        'note_internal',
        'service_description',
        'products_used',
        'amount_paid_pln',
        'payment_method',
    ];

    protected $casts = [
        'appointment_at' => 'datetime',
        'price_pln' => 'integer',
        'discount_percent' => 'integer',
        'amount_paid_pln' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function serviceVariant()
    {
        return $this->belongsTo(ServiceVariant::class, 'service_variant_id');
    }

    /**
     * Alias for the serviceVariant relationship used in views/controllers.
     */
    public function variant()
    {
        return $this->serviceVariant();
    }
}
