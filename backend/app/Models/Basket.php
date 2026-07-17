<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Basket extends Model
{
    protected $guarded = [];
    
    protected $casts = [
        'symbols' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
