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
        return $this->success($request->user(), 'Profile retrieved successfully');
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
            'location' => ['sometimes', 'string', 'max:255'],
            'preferences' => ['sometimes', 'array'],
            'fcm_token' => ['sometimes', 'string', 'nullable'],
            'password' => ['sometimes', 'string', 'min:8', 'confirmed'],
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return $this->success($user, 'Profile updated successfully');
    }
}
