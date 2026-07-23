<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinancialStatementNormalized extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'financial_statements_normalized';

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
     * Get the raw financial statement associated with this normalized statement.
     */
    public function rawStatement()
    {
        return $this->belongsTo(FinancialStatementRaw::class, 's3_key', 's3_key');
    }
}
