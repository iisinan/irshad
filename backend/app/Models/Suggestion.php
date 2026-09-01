<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Suggestion extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'message', 'status'];

    protected $with = ['user']; // always eager load user if needed, or we can just define the relation

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
