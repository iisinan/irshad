<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Watchlist extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'symbol',
        'alert_inapp',
        'alert_push',
        'alert_email',
        'alert_verdict_change',
        'alert_compliance_risk',
        'alert_weekly_digest',
        'alert_price_change',
    ];

    protected $casts = [
        'alert_inapp' => 'boolean',
        'alert_push' => 'boolean',
        'alert_email' => 'boolean',
        'alert_verdict_change' => 'boolean',
        'alert_compliance_risk' => 'boolean',
        'alert_weekly_digest' => 'boolean',
        'alert_price_change' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
