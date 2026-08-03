<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FinancialReviewQueue extends Model
{
    use HasFactory;

    protected $table = 'financial_review_queue';

    protected $guarded = [];

    protected $casts = [
        'extracted_data' => 'array',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
