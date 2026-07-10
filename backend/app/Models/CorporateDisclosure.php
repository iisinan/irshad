<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CorporateDisclosure extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_symbol',
        'company_name',
        'title',
        'pdf_url',
        'submission_type',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];
}
