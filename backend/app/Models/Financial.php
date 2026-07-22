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
        'eps',
        'pe_ratio',
        'roe',
        'dividend_yield',
        'profit_margin',
        'cash_and_equivalents',
        'interest_bearing_securities',
        'accounts_receivable',
        'illiquid_assets',
    ];

    protected $appends = ['interest_income_ratio', 'non_compliant_income_ratio'];

    public function getInterestIncomeRatioAttribute()
    {
        $revenue = (float) $this->total_revenue;
        if ($revenue == 0) {
            return 0;
        }
        return round(((float) $this->interest_income / $revenue) * 100, 2);
    }

    public function getNonCompliantIncomeRatioAttribute()
    {
        return $this->interest_income_ratio;
    }
}
