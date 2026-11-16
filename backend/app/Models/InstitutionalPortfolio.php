<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InstitutionalPortfolio extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'fund_code',
        'benchmark',
        'currency',
        'holdings_payload',
        'summary_snapshot',
        'factsheet_meta',
    ];

    protected function casts(): array
    {
        return [
            'holdings_payload' => 'array',
            'summary_snapshot' => 'array',
            'factsheet_meta' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
