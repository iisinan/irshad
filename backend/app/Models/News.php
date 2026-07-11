<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class News extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'url',
        'source',
        'thumbnail_url',
        'published_at',
        'excerpt',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];
}
