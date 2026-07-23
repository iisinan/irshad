<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusinessScreening extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'ticker',
        'business_summary',
        'current_core_business',
        'detected_business_activities',
        'detected_prohibited_activities',
        'supporting_evidence',
        'source_urls',
        'source_publication_dates',
        'ai_explanation',
        'confidence_score',
        'business_compliance_status',
        'last_analysed_timestamp',
    ];

    protected $casts = [
        'detected_business_activities' => 'array',
        'detected_prohibited_activities' => 'array',
        'supporting_evidence' => 'array',
        'source_urls' => 'array',
        'source_publication_dates' => 'array',
        'confidence_score' => 'float',
        'last_analysed_timestamp' => 'datetime',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
