<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserNotification extends Model
{
    protected $fillable = [
        'user_id',
        'icon',
        'title',
        'message',
        'category',
        'action_url',
        'action_label',
        'read_at',
        'archived_at',
        'meta',
    ];

    protected $casts = [
        'read_at' => 'datetime',
        'archived_at' => 'datetime',
        'meta' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isRead(): bool
    {
        return $this->read_at !== null;
    }

    public function markAsRead(): void
    {
        if (! $this->read_at) {
            $this->update(['read_at' => now()]);
        }
    }

    /**
     * Helper: create a notification for a user.
     */
    public static function notify(int $userId, string $title, string $message, array $options = []): self
    {
        return self::create([
            'user_id' => $userId,
            'icon' => $options['icon'] ?? '🔔',
            'title' => $title,
            'message' => $message,
            'category' => $options['category'] ?? 'system',
            'action_url' => $options['action_url'] ?? null,
            'action_label' => $options['action_label'] ?? null,
            'meta' => $options['meta'] ?? null,
        ]);
    }
}
