<?php

namespace App\Http\Middleware;

use App\Models\InstitutionalApiKey;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class InstitutionApiAuthMiddleware
{
    /**
     * Authenticate B2B broker/institution API calls via either:
     * 1) `X-Api-Key: irsh_live_...` or `Authorization: Bearer irsh_live_...`
     * 2) Existing Sanctum institutional/admin session token (for in-portal testing)
     */
    public function handle(Request $request, Closure $next): Response
    {
        $apiKeyHeader = $request->header('X-Api-Key');
        $bearer = $request->bearerToken();
        $rawKey = $apiKeyHeader ?: ($bearer && str_starts_with($bearer, 'irsh_live_') ? $bearer : null);

        if ($rawKey) {
            $hash = hash('sha256', trim($rawKey));
            $keyRecord = InstitutionalApiKey::with('user')->where('key_hash', $hash)->first();

            if (! $keyRecord || ! $keyRecord->isActive() || ! $keyRecord->user) {
                return response()->json(['message' => 'Invalid, expired, or revoked institutional API key.'], 401);
            }

            if (! in_array($keyRecord->user->role, ['institution', 'admin'], true)) {
                return response()->json(['message' => 'API key owner lacks institutional privileges.'], 403);
            }

            $keyRecord->forceFill(['last_used_at' => now()])->saveQuietly();
            auth()->setUser($keyRecord->user);
            $request->setUserResolver(fn () => $keyRecord->user);
            $request->attributes->set('institutional_api_key', $keyRecord);

            return $next($request);
        }

        // Fall back to Sanctum token / session authentication for interactive dashboard testing
        $user = auth('sanctum')->user() ?? auth()->user();
        if (! $user && $bearer) {
            $token = PersonalAccessToken::findToken($bearer);
            if ($token && $token->tokenable) {
                $user = $token->tokenable;
            }
        }

        if (! $user) {
            return response()->json(['message' => 'Missing institutional API key or bearer token.'], 401);
        }

        if (! in_array($user->role, ['institution', 'admin'], true)) {
            return response()->json(['message' => 'Unauthorized. Institutional access required.'], 403);
        }

        auth()->setUser($user);
        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
