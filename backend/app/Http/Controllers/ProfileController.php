<?php

namespace App\Http\Controllers;

use App\Traits\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    use ApiResponder;

    /**
     * Get profile of authenticated user.
     */
    public function show(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        
        $user = \Illuminate\Support\Facades\Cache::tags(['users'])->remember("user.profile.{$userId}", 3600, function () use ($userId) {
            $u = \App\Models\User::find($userId);
            $u->screened_count = \App\Models\History::where('user_id', $userId)
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
        
        \Illuminate\Support\Facades\Cache::tags(['users'])->forget("user.profile.{$user->id}");

        return $this->success($user, 'Profile updated successfully');
    }
}
