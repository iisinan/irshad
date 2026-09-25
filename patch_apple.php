<?php
$content = file_get_contents('backend/app/Http/Controllers/AuthController.php');

$appleLoginMethod = <<<'METHOD'

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
            // or the web service ID. We check if it matches APPLE_CLIENT_ID
            $expectedClientId = env('APPLE_CLIENT_ID', 'com.irshad.irshadMobile');
            if ($decoded->aud !== $expectedClientId) {
                throw new \Exception('Invalid Apple audience. Expected: ' . $expectedClientId . ', got: ' . $decoded->aud);
            }

            $appleId = $decoded->sub;
            
            // Apple only sends email and name on the very first login, so we capture them from the request if provided
            $email = $request->email ?? ($decoded->email ?? null);
            $name = $request->fullName ?? 'Apple User';

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
            } else {
                // Update apple_id if missing
                $user->update([
                    'apple_id' => $appleId,
                ]);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

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
METHOD;

// Insert it before the logout method
$content = str_replace('public function logout(Request $request)', $appleLoginMethod . "\n\n    public function logout(Request $request)", $content);

file_put_contents('backend/app/Http/Controllers/AuthController.php', $content);
echo "Patched\n";
