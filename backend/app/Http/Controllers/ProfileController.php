<?php

namespace App\Http\Controllers;

use App\Models\History;
use App\Models\User;
use App\Traits\ApiResponder;
use App\Traits\SafeCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    use ApiResponder;
    use SafeCache;

    /**
     * Get profile of authenticated user.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('activeSubscription.plan');
        $userId = $user->id;

        $user->screened_count = $this->safeTaggedCache(['users'])->remember("user.screened_count.{$userId}", 300, function () use ($userId) {
            return History::where('user_id', $userId)
                ->whereIn('action', ['scan', 'check'])
                ->distinct('reference_id')
                ->count('reference_id');
        });
        $user->append(['tier', 'has_paid_subscription']);
        $user->usage_summary = \App\Services\SubscriptionService::getUsageSummary($user);

        return $this->success($user, 'Profile retrieved successfully');
    }

    /**
     * Update user profile.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone_number' => ['sometimes', 'string', 'nullable', 'max:20'],
            'location' => ['sometimes', 'string', 'max:255'],
            'preferences' => ['sometimes', 'array'],
            'fcm_token' => ['sometimes', 'string', 'nullable'],
            'password' => ['sometimes', 'string', 'min:8', 'confirmed'],
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        if (isset($validated['preferences'])) {
            if (array_key_exists('zakat_hawl_date', $validated['preferences']) && !\App\Services\SubscriptionService::canUseFeature($user, 'zakat_calc')) {
                return response()->json([
                    'error' => 'Upgrade Required',
                    'upgrade_required' => true,
                    'feature' => 'zakat_calc',
                    'required_tier' => 'pro',
                    'message' => 'Automated Zakat calculation and Hawl tracking require the Rawdha (Pro) or Noor (Max) plan.',
                ], 403);
            }
            $existingPreferences = $user->preferences ?? [];
            $validated['preferences'] = array_merge($existingPreferences, $validated['preferences']);
        }

        $user->update($validated);

        $this->safeForgetTagged(['users'], "user.profile.{$user->id}");

        return $this->success($user, 'Profile updated successfully');
    }
}
