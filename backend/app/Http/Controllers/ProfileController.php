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
        $userId = $request->user()->id;

        $user = $this->safeTaggedCache(['users'])->remember("user.profile.{$userId}", 3600, function () use ($userId) {
            $u = User::find($userId);
            $u->screened_count = History::where('user_id', $userId)
                ->whereIn('action', ['scan', 'check'])
                ->distinct('reference_id')
                ->count('reference_id');

            return $u;
        });

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
            $existingPreferences = $user->preferences ?? [];
            $validated['preferences'] = array_merge($existingPreferences, $validated['preferences']);
        }

        $user->update($validated);

        $this->safeForgetTagged(['users'], "user.profile.{$user->id}");

        return $this->success($user, 'Profile updated successfully');
    }
}
