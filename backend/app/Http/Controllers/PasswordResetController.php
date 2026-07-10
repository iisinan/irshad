<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    /**
     * Send the password reset link (simulated for now since no SMTP).
     */
    public function sendResetLink(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        
        $user = User::where('email', $request->email)->first();
        if ($user) {
            // In a real app, generate token and send email.
            // For now, we simulate a successful email sent.
            \Log::info('Password reset requested for: ' . $user->email);
        }

        return response()->json(['message' => 'If that email exists, a reset link was sent.']);
    }

    /**
     * Reset the password (simulated/simplified).
     */
    public function reset(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed'
        ]);

        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            return response()->json(['message' => 'Invalid email or token.'], 400);
        }

        $user->forceFill([
            'password' => Hash::make($request->password)
        ])->save();

        return response()->json(['message' => 'Password reset successfully.']);
    }
}
