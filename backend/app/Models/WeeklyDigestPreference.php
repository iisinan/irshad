<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WeeklyDigestPreference extends Model
{
    protected $fillable = [
        'user_id',
        'email_enabled',
        'in_app_enabled',
        'frequency',
        'last_sent_at',
    ];

    protected $casts = [
        'email_enabled'  => 'boolean',
        'in_app_enabled' => 'boolean',
        'last_sent_at'   => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
