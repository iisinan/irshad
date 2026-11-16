<?php

namespace App\Models;

use App\Notifications\QueuedResetPasswordNotification;
use App\Notifications\VerifyEmailNotification;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'location',
        'role',
        'institution_name',
        'institution_type',
        'plan',
        'preferences',
        'google_id', 'apple_id',
        'avatar',
        'phone_number',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    
    protected $appends = [
        'tier',
        'has_paid_subscription',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    public function baskets()
    {
        return $this->hasMany(Basket::class);
    }

    public function purifications()
    {
        return $this->hasMany(Purification::class);
    }

    public function priceAlerts()
    {
        return $this->hasMany(PriceAlert::class);
    }

    public function notifications()
    {
        return $this->hasMany(UserNotification::class);
    }

    public function holdings()
    {
        return $this->hasMany(Holding::class);
    }

    public function watchlists()
    {
        return $this->hasMany(Watchlist::class);
    }

    public function favorites()
    {
        return $this->hasMany(Favorite::class);
    }

    public function institutionalPortfolios()
    {
        return $this->hasMany(InstitutionalPortfolio::class);
    }

    public function institutionalApiKeys()
    {
        return $this->hasMany(InstitutionalApiKey::class);
    }

    public function isInstitution(): bool
    {
        return $this->role === 'institution';
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'welcome_email_sent_at' => 'datetime',
            'launch_announcement_sent_at' => 'datetime',
            'password' => 'hashed',
            'preferences' => 'array',
        ];
    }

    /**
     * Override to use our queued notification so the HTTP response
     * is instant — the actual email is dispatched via Redis queue.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new QueuedResetPasswordNotification($token));
    }

    /**
     * Send the email verification notification.
     */
    public function sendEmailVerificationNotification()
    {
        $this->notify(new VerifyEmailNotification);
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function activeSubscription()
    {
        return $this->hasOne(Subscription::class)
            ->where(function ($query) {
                $query->where(function ($q) {
                    $q->where('status', 'active')
                      ->where(function ($subQ) {
                          $subQ->whereNull('ends_at')
                               ->orWhere('ends_at', '>', now());
                      });
                })
                ->orWhere(function ($q) {
                    $q->whereIn('status', ['canceled', 'past_due'])
                      ->whereNotNull('ends_at')
                      ->where('ends_at', '>', now());
                });
            })
            ->latestOfMany();
    }

    public function usages()
    {
        return $this->hasMany(UserUsage::class);
    }

    public function getHasPaidSubscriptionAttribute()
    {
        $sub = $this->activeSubscription;
        return (bool) ($sub && $sub->plan && $sub->plan->slug !== 'free');
    }

    public function getTierAttribute()
    {
        if (in_array($this->role, ['institution', 'admin'], true)) {
            return new Plan([
                'slug' => $this->role === 'institution' ? 'institution' : 'max',
                'name' => $this->role === 'institution' ? 'Institutional' : 'Admin',
                'features' => [
                    'stock_screens_per_month' => -1,
                    'portfolio_limit' => -1,
                    'watchlist_limit' => -1,
                    'baskets' => -1,
                    'statements' => true,
                    'purifications_per_month' => -1,
                    'zakat_calc' => true,
                    'dividend_alerts' => true,
                    'drift_tracking' => true,
                    'monthly_spotlight' => true,
                ],
            ]);
        }

        $activeSub = $this->activeSubscription;
        
        // If the user has an explicit active subscription, return its plan
        if ($activeSub && $activeSub->plan) {
            return $activeSub->plan;
        }

        // Default unsubscribed users to Miftah (Free) tier
        return Plan::where('slug', 'free')->first()
            ?? new Plan([
                'slug' => 'free',
                'name' => 'Miftah',
                'features' => [
                    'stock_screens_per_month' => 3,
                    'portfolio_limit' => 3,
                    'watchlist_limit' => 0,
                    'baskets' => 0,
                    'statements' => false,
                    'purifications_per_month' => 0,
                    'zakat_calc' => false,
                    'dividend_alerts' => false,
                    'drift_tracking' => false,
                    'monthly_spotlight' => false,
                ],
            ]);
    }
}
