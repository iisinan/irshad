<?php

namespace App\Http\Middleware;

use App\Services\SubscriptionService;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SendThresholdUpgradeEmail
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $user = $request->user();
        if (!$user || !$response instanceof JsonResponse) {
            return $response;
        }

        $data = $response->getData(true);
        if (!is_array($data)) {
            return $response;
        }

        $isUpgradeGate = ($data['upgrade_required'] ?? false) === true
            || (($data['error'] ?? null) === 'Upgrade Required' && $response->getStatusCode() === 403);

        if (!$isUpgradeGate) {
            return $response;
        }

        $feature = (string) ($data['feature'] ?? 'general');
        $requiredTier = isset($data['required_tier']) ? (string) $data['required_tier'] : null;
        $reason = isset($data['message']) ? (string) $data['message'] : null;

        SubscriptionService::sendThresholdUpgradeEmail($user, $feature, $requiredTier, $reason);

        return $response;
    }
}
