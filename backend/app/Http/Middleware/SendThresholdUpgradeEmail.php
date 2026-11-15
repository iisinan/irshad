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

        $chatMeta = is_array($data['assistant_message']['metadata'] ?? null)
            ? $data['assistant_message']['metadata']
            : null;

        $isTopLevelGate = ($data['upgrade_required'] ?? false) === true
            || (($data['error'] ?? null) === 'Upgrade Required' && $response->getStatusCode() === 403);
        $isChatGate = is_array($chatMeta) && (($chatMeta['upgrade_required'] ?? false) === true);

        if (!$isTopLevelGate && !$isChatGate) {
            return $response;
        }

        $feature = (string) ($isChatGate
            ? ($chatMeta['upgrade_feature'] ?? 'chat_gate')
            : ($data['feature'] ?? 'general'));
        $requiredTierRaw = $isChatGate
            ? ($chatMeta['required_tier'] ?? null)
            : ($data['required_tier'] ?? null);
        $requiredTier = $requiredTierRaw !== null ? (string) $requiredTierRaw : null;
        $reasonRaw = $isChatGate
            ? ($data['assistant_message']['content'] ?? null)
            : ($data['message'] ?? null);
        $reason = $reasonRaw !== null ? (string) $reasonRaw : null;

        SubscriptionService::sendThresholdUpgradeEmail($user, $feature, $requiredTier, $reason);

        return $response;
    }
}
