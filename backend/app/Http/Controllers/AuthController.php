<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use App\Traits\ApiResponder;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    use ApiResponder;

    /**
     * Register a new user.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'password' => Hash::make($request->password),
            'location' => $request->location,
            'role' => 'user', // Default role
            'preferences' => [
                'investor_type' => $request->investor_type,
                'primary_use_case' => $request->primary_use_case,
                'investment_experience' => $request->investment_experience,
                'dob' => $request->dob,
            ],
        ]);

        event(new Registered($user));

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->success([
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ], 'User registered successfully', 201);
    }

    /**
     * Login user and create token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        if (! Auth::attempt($request->only('email', 'password'))) {
            return $this->unauthorized('Invalid login details');
        }

        // Auth::user() returns the already-loaded user — no second DB query needed
        $user = Auth::user();
        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->success([
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ], 'Login successful');
    }

    /**
     * Login or Register user using Google id_token.
     */
    public function googleLogin(Request $request): JsonResponse
    {
        $request->validate([
            'credential' => 'required|string',
        ]);

        $client = new \Google_Client(['client_id' => env('GOOGLE_CLIENT_ID')]);
        $payload = $client->verifyIdToken($request->credential);
        
        // Fallback to mobile client ID if web client ID fails
        if (!$payload && env('GOOGLE_CLIENT_ID_MOBILE')) {
            $mobileClient = new \Google_Client(['client_id' => env('GOOGLE_CLIENT_ID_MOBILE')]);
            $payload = $mobileClient->verifyIdToken($request->credential);
        }

        if (!$payload) {
            \Log::error('Invalid Google token verification failed for credential: ' . $request->credential . ' with expected client id: ' . env('GOOGLE_CLIENT_ID'));
            return $this->unauthorized('Invalid Google token');
        }

        $googleId = $payload['sub'];
        $email = $payload['email'];
        $name = $payload['name'] ?? 'Google User';
        $avatar = $payload['picture'] ?? null;

        // Find user by google_id or email
        $user = User::where('google_id', $googleId)->orWhere('email', $email)->first();

        if (! $user) {
            // Register new user
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'google_id' => $googleId,
                'avatar' => $avatar,
                'password' => null,
                'role' => 'user',
                'preferences' => [],
            ]);
            // Mark Google-authenticated users as immediately verified
            $user->markEmailAsVerified();
        } else {
            // Update google_id and avatar if missing
            $user->update([
                'google_id' => $googleId,
                'avatar' => $user->avatar ?? $avatar,
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->success([
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ], 'Google login successful');
    }

    /**
     * Logout user (revoke token).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success(null, 'Successfully logged out');
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        return $this->success($request->user());
    }
}
