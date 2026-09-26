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

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
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
        return $this->hasOne(Subscription::class)->where('status', 'active')->latestOfMany();
    }

    public function usages()
    {
        return $this->hasMany(UserUsage::class);
    }

        public function getHasPaidSubscriptionAttribute()
    {
        return $this->subscriptions()->where('status', 'active')->exists();
    }

    public function getTierAttribute()
    {
        $activeSub = $this->activeSubscription;
        
        // If the user has an explicit active subscription (even 'free' set by admin), respect it first
        if ($activeSub && $activeSub->plan) {
            return $activeSub->plan;
        }

        // October 2nd Rollout Strategy: Free Trial Override for users without explicit subscriptions
        if (now()->lt(\Carbon\Carbon::parse('2026-10-02'))) {
            return Plan::where('slug', 'max')->first() 
                ?? new Plan(['slug' => 'max', 'name' => 'Noor']); // Fallback if not seeded yet
        }

        // Default to Free Tier
        return Plan::where('slug', 'free')->first() 
            ?? new Plan(['slug' => 'free', 'name' => 'Miftah']);
    }
}
