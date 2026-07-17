<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Watchlist extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'symbol',
        'alert_whatsapp',
        'alert_email',
    ];

    protected $casts = [
        'alert_whatsapp' => 'boolean',
        'alert_email' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
