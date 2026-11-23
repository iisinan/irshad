<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Mail\WelcomeEmail;
use App\Models\User;
use App\Traits\ApiResponder;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

class AuthController extends Controller
{
    use ApiResponder;

    /**
     * Register a new user.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $isInstitution = $request->input('account_type') === 'institution';

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'password' => Hash::make($request->password),
            'location' => $request->location,
            'role' => $isInstitution ? 'institution' : 'user',
            'institution_name' => $isInstitution ? $request->input('institution_name') : null,
            'institution_type' => $isInstitution ? $request->input('institution_type', 'Asset / Fund Manager') : null,
            'preferences' => [
                'investor_type' => $isInstitution ? 'Institutional Manager' : $request->investor_type,
                'primary_use_case' => $request->primary_use_case,
                'investment_experience' => $request->investment_experience,
                'dob' => $request->dob,
            ],
        ]);

        event(new Registered($user));
        $this->sendWelcomeEmail($user);

        $token = $user->createToken('auth_token')->plainTextToken;
        $user = $this->hydrateUserForClient($user);

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
        $user = $this->hydrateUserForClient($user);

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

        $clientIds = array_values(array_unique(array_filter([
            config('services.google.client_id'),
            config('services.google.web_client_id'),
            config('services.google.ios_client_id'),
            config('services.google.mobile_client_id'),
        ])));

        $payload = null;
        foreach ($clientIds as $clientId) {
            try {
                $client = new \Google_Client(['client_id' => $clientId]);
                $verified = $client->verifyIdToken($request->credential);
                if (is_array($verified)) {
                    $payload = $verified;
                    break;
                }
            } catch (\Throwable $e) {
                // Continue trying remaining configured client IDs before failing.
            }
        }

        if (!$payload) {
            \Log::error('Invalid Google token verification failed', [
                'configured_client_ids' => $clientIds,
            ]);
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
            $this->sendWelcomeEmail($user);
        } else {
            // Update google_id and avatar if missing
            $user->update([
                'google_id' => $googleId,
                'avatar' => $user->avatar ?? $avatar,
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $user = $this->hydrateUserForClient($user);

        return $this->success([
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ], 'Google login successful');
    }

    /**
     * Logout user (revoke token).
     */
    
    /**
     * Login or Register user using Apple identityToken.
     */
    public function appleLogin(Request $request): JsonResponse
    {
        $request->validate([
            'identityToken' => 'required|string',
        ]);

        try {
            // Fetch Apple's public keys
            $jwksJson = \Illuminate\Support\Facades\Cache::remember('apple_jwks', 86400, function () {
                return file_get_contents('https://appleid.apple.com/auth/keys');
            });
            $jwks = json_decode($jwksJson, true);
            $keys = \Firebase\JWT\JWK::parseKeySet($jwks);

            // Verify the token
            $decoded = \Firebase\JWT\JWT::decode($request->identityToken, $keys);
            
            // Validate the issuer and audience
            if ($decoded->iss !== 'https://appleid.apple.com') {
                throw new \Exception('Invalid Apple issuer');
            }
            
            // The audience should be the iOS bundle ID (com.irshad.irshadMobile)
            // or the web service ID. We check if it matches configured APPLE_CLIENT_ID
            $expectedClientId = config('services.apple.client_id', 'com.irshad.irshadMobile');
            if ($decoded->aud !== $expectedClientId) {
                throw new \Exception('Invalid Apple audience. Expected: ' . $expectedClientId . ', got: ' . $decoded->aud);
            }

            $appleId = $decoded->sub;
            
            // Apple only sends email and name on the very first login, so we capture them from the request if provided
            $email = $request->email ?? ($decoded->email ?? null);
            $name = trim((string) $request->fullName) ?: 'Apple User';

            // Find user by apple_id or email
            $user = User::where('apple_id', $appleId);
            if ($email) {
                $user = $user->orWhere('email', $email);
            }
            $user = $user->first();

            if (! $user) {
                if (!$email) {
                    return $this->unauthorized('Email is required for first-time registration but Apple did not provide it.');
                }
                // Register new user
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'apple_id' => $appleId,
                    'password' => null,
                    'role' => 'user',
                    'preferences' => [],
                ]);
                $user->markEmailAsVerified();
                $this->sendWelcomeEmail($user);
            } else {
                // Update apple_id if missing
                $user->update([
                    'apple_id' => $appleId,
                ]);
            }

            $token = $user->createToken('auth_token')->plainTextToken;
            $user = $this->hydrateUserForClient($user);

            return $this->success([
                'user' => $user,
                'access_token' => $token,
                'token_type' => 'Bearer',
            ], 'Apple login successful');

        } catch (\Exception $e) {
            \Log::error('Apple login failed: ' . $e->getMessage());
            return $this->unauthorized('Invalid Apple token: ' . $e->getMessage());
        }
    }

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
        return $this->success($this->hydrateUserForClient($request->user()));
    }

    /**
     * Send the one-time welcome email when a user registers for the first time.
     */
    private function sendWelcomeEmail(User $user): void
    {
        if (! $user->email || ! filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            return;
        }

        $hasCol = Schema::hasColumn('users', 'welcome_email_sent_at');
        if ($hasCol && $user->welcome_email_sent_at !== null) {
            return;
        }

        try {
            $mailable = new WelcomeEmail($user);
            if ($user->role === 'institution') {
                Mail::to($user->email)->sendNow($mailable);
            } else {
                Mail::to($user->email)->queue($mailable);
            }
            if ($hasCol) {
                $user->forceFill(['welcome_email_sent_at' => now()])->saveQuietly();
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to send welcome email', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Ensure subscription/tier metadata and usage summary are present on auth user responses.
     */
    private function hydrateUserForClient(User $user): User
    {
        $user->load('activeSubscription.plan');
        $user->append(['tier', 'has_paid_subscription']);
        $user->usage_summary = \App\Services\SubscriptionService::getUsageSummary($user);

        return $user;
    }
}
