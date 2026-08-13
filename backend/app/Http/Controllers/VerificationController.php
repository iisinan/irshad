<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Traits\ApiResponder;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class VerificationController extends Controller
{
    use ApiResponder;

    public function verify(Request $request, $id, $hash)
    {
        $user = User::findOrFail($id);

        if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return response()->json(['message' => 'Invalid verification link'], 400);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified']);
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
            Cache::tags(['users'])->forget("user.profile.{$user->id}");
        }

        return response()->json(['message' => 'Email has been verified']);
    }

    public function resend(Request $request)
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified']);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification link sent']);
    }
}
