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
        'status',
        'reviewed_by',
        'reviewed_at'
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
