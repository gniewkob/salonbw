<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WhatsAppMessageLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'recipient',
        'template',
        'parameters',
        'status',
        'response_id',
        'error_code',
        'error_body',
    ];

    protected $casts = [
        'parameters' => 'array',
        'created_at' => 'datetime',
    ];

    public const UPDATED_AT = null;
}
