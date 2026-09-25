<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserUsage extends Model
{
    protected $fillable = [
        'user_id',
        'feature',
        'used_count',
        'reset_at',
    ];

    protected $casts = [
        'reset_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
