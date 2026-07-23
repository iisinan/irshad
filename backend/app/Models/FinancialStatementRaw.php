<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinancialStatementRaw extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'financial_statements_raw';

    /**
     * Indicates if the model should be timestamped.
     * We disable timestamps because the AI Engine manages its own timestamps.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array
     */
    protected $guarded = [];

    /**
     * Get the normalized financial statement associated with this raw statement.
     */
    public function normalizedStatement()
    {
        return $this->hasOne(FinancialStatementNormalized::class, 's3_key', 's3_key');
    }
}
