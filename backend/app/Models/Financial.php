<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Financial extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'total_assets',
        'total_debt',
        'total_revenue',
        'market_cap',
        'interest_income',
    ];

    protected $appends = ['interest_income_ratio', 'non_compliant_income_ratio'];

    public function getInterestIncomeRatioAttribute()
    {
        $revenue = $this->total_revenue ?: 1;
        return round(($this->interest_income / $revenue) * 100, 2);
    }

    public function getNonCompliantIncomeRatioAttribute()
    {
        return $this->interest_income_ratio;
    }
}
