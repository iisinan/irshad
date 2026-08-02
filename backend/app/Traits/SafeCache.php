<?php

namespace App\Traits;

use Illuminate\Cache\Repository;
use Illuminate\Cache\TaggedCache;
use Illuminate\Support\Facades\Cache;

trait SafeCache
{
    /**
     * Returns a tagged cache store (Redis) or falls back to tagless cache
     * if Redis is unavailable — prevents 500 errors when Redis is starting up.
     */
    protected function safeTaggedCache(array $tags): TaggedCache|Repository
    {
        try {
            $store = Cache::tags($tags);
            // Ping Redis to verify it's truly available
            $store->has('__ping__');

            return $store;
        } catch (\Exception $e) {
            return Cache::store();
        }
    }

    /**
     * Safely flush a cache tag group. Falls back to full cache flush if Redis unavailable.
     */
    protected function safeFlushTag(array $tags): void
    {
        try {
            Cache::tags($tags)->flush();
        } catch (\Exception $e) {
            // Silently fail — a full flush is too destructive as a fallback
        }
    }

    /**
     * Safely forget a single key from a tagged store.
     */
    protected function safeForgetTagged(array $tags, string $key): void
    {
        try {
            Cache::tags($tags)->forget($key);
        } catch (\Exception $e) {
            Cache::forget($key);
        }
    }
}
