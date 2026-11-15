<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Suggestion extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'chat_conversation_id', 'message', 'status', 'is_admin_reply'];

    protected $with = ['user']; // always eager load user if needed, or we can just define the relation

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function chatConversation(): BelongsTo
    {
        return $this->belongsTo(ChatConversation::class, 'chat_conversation_id');
    }
}
