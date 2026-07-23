<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinancialScreening extends Model
{
    protected $table = 'financial_screenings';

    // AI Engine uses UUIDs for this table
    protected $keyType = 'string';
    public $incrementing = false;

    // Use AI Engine's timestamps
    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'raw_source_values' => 'array',
        'normalized_values' => 'array',
        'chosen_values' => 'array',
        'source_urls' => 'array',
        'calculation_results' => 'array',
        'published_date' => 'datetime',
    ];

    public function getTickerAttribute()
    {
        return $this->company_ticker;
    }

    public function getCompanyNameAttribute()
    {
        return $this->company_ticker; // Fallback to ticker since name isn't stored here
    }

    public function getIsCompliantAttribute()
    {
        return $this->calculation_results['overall_financial_pass'] ?? null;
    }

    public function getDebtRatioPctAttribute()
    {
        $val = $this->calculation_results['ratios']['interest_bearing_debt_ratio'] ?? null;
        return $val !== null ? $val * 100 : null; // Convert to percentage
    }

    public function getImpermissibleIncomeRatioPctAttribute()
    {
        $val = $this->calculation_results['ratios']['non_permissible_income_ratio'] ?? null;
        return $val !== null ? $val * 100 : null;
    }
}
