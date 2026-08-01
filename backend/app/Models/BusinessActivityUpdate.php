<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusinessActivityUpdate extends Model
{
    protected $fillable = [
        'company_id',
        'activity_type',
        'summary',
        'source',
        'source_url',
        'confidence_level',
        'confidence_score',
        'date_detected',
    ];

    protected $casts = [
        'date_detected' => 'datetime',
        'confidence_score' => 'float',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Return a human-readable activity type label.
     */
    public function getActivityTypeLabelAttribute(): string
    {
        return match ($this->activity_type) {
            'acquisition' => 'New Acquisition',
            'new_business' => 'New Line of Business',
            'disposal' => 'Business Unit Disposal',
            'prohibited_activity' => 'Prohibited Activity Detected',
            'islamic_finance' => 'Entry into Islamic Finance',
            'regulatory' => 'Regulatory Announcement',
            default => ucfirst(str_replace('_', ' ', $this->activity_type)),
        };
    }
}
