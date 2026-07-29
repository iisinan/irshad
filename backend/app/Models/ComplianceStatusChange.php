<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ComplianceStatusChange extends Model
{
    protected $fillable = [
        'company_id',
        'previous_status',
        'new_status',
        'reason',
        'report_url',
        'updated_at_change',
    ];

    protected $casts = [
        'updated_at_change' => 'datetime',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
