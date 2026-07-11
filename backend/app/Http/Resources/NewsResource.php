<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NewsResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'url' => $this->url,
            'source' => $this->source,
            'thumbnail_url' => $this->thumbnail_url,
            'excerpt' => $this->excerpt,
            'published_at' => $this->published_at?->toIso8601String(),
            'published_human' => $this->published_at?->diffForHumans(),
        ];
    }
}
