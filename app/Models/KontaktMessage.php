<?php

// app/Models/KontaktMessage.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KontaktMessage extends Model
{
    protected $fillable = [
        'user_id',          // kto wysłał (null dla nie-zalogowanych)
        'admin_id',         // kto odpisał (admin), null jeśli brak
        'message',          // treść zapytania
        'reply_to_id',      // id wiadomości, na którą odpisujesz
        'reply',            // treść odpowiedzi admina (legacy/pierwszy poziom odpowiedzi)
        'is_from_admin',    // czy to odpowiedź admina
        'is_read',          // czy klient przeczytał odpowiedź
        // ...inne pola (np. email, imię/nazwisko itd)
    ];

    public function user()    { return $this->belongsTo(User::class, 'user_id'); }
    public function admin()   { return $this->belongsTo(User::class, 'admin_id'); }
    public function parent()  { return $this->belongsTo(KontaktMessage::class, 'reply_to_id'); }
    public function replies() { return $this->hasMany(KontaktMessage::class, 'reply_to_id'); }
}
