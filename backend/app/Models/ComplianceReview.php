<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ComplianceReview extends Model
{
    protected $fillable = [
        'company_id',
        'old_status',
        'new_status',
        'reason',
        'payload',
        'status',
        'reviewed_by',
        'reviewed_at'
    ];

    protected $casts = [
        'payload' => 'array',
        'reviewed_at' => 'datetime',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
