<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class KontaktMessage extends Model
{
    use HasFactory;

    public const STATUS_SENT = 'wyslane';
    public const STATUS_READ = 'odczytana';
    public const STATUS_NEW_REPLY = 'nowa';

    protected $table = 'kontakt_messages';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'message',
        'category',
        'status',
        'user_id',
        'admin_id',
        'reply_to_id',
        'is_from_admin',
        'is_read',
    ];
    protected $attributes = [
        'is_from_admin' => false,
        'is_read' => false,
        'status' => self::STATUS_SENT,
    ];

    protected $casts = [
        'is_from_admin' => 'boolean',
        'is_read' => 'boolean',
    ];

    // Relacje
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function replies()
    {
        return $this->hasMany(KontaktMessage::class, 'reply_to_id');
    }

    public function parent()
    {
        return $this->belongsTo(KontaktMessage::class, 'reply_to_id');
    }
}
