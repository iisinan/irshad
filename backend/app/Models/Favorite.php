<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Favorite extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'reference_id',
        'alert_whatsapp',
        'alert_email',
    ];

    protected $casts = [
        'alert_whatsapp' => 'boolean',
        'alert_email' => 'boolean',
    ];
}
