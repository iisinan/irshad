<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminAlert extends Model
{
    protected $fillable = [
        'company_id',
        'type',
        'message',
        'resolved',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
