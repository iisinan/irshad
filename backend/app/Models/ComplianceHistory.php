<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ComplianceHistory extends Model
{
    protected $fillable = [
        'company_id',
        'old_status',
        'new_status',
        'reason',
        'changed_at',
    ];

    protected $casts = [
        'changed_at' => 'datetime',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
