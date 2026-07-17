<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Resource extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'scholar',
        'type', // 'video', 'document'
        'duration',
        'thumbnail',
        'url',
        'category',
        'external_id' // e.g., YouTube Video ID to avoid duplicates
    ];
}
