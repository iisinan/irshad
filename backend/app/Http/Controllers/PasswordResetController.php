<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\User;
use App\Traits\ApiResponder;

class PasswordResetController extends Controller
{
    use ApiResponder;

    /**
     * Send the password reset link via Resend email.
     * Always returns 200 to prevent user enumeration.
     */
    public function sendResetLink(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        // Use Laravel's password broker — generates a secure token,
        // stores it in password_reset_tokens, and dispatches the email
        // to the queue (Redis) so the HTTP response is instant.
        $status = Password::sendResetLink(
            $request->only('email')
        );

        // Always return the same message to prevent email enumeration attacks
        return response()->json([
            'message' => 'If that email exists in our system, a reset link has been sent.',
        ]);
    }

    /**
     * Reset the password using the token from the email link.
     */
    public function reset(Request $request)
    {
        $request->validate([
            'token'                 => 'required|string',
            'email'                 => 'required|email',
            'password'              => 'required|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();

                // Revoke all existing API tokens so old sessions become invalid
                $user->tokens()->delete();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Password has been successfully reset.']);
        }

        return response()->json([
            'message' => match ($status) {
                Password::INVALID_TOKEN => 'This reset link is invalid or has expired. Please request a new one.',
                Password::INVALID_USER  => 'We could not find a user with that email address.',
                default                 => 'Something went wrong. Please try again.',
            }
        ], 400);
    }
}
