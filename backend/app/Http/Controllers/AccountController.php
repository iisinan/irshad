<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function destroy(Request $request)
    {
        $user = $request->user();
        
        if ($user) {
            // Revoke all tokens
            $user->tokens()->delete();
            
            // Delete user data (cascade should handle related data if DB is set up that way, otherwise explicit delete)
            $user->delete();
            
            return response()->json(['message' => 'Account successfully deleted.']);
        }

        return response()->json(['message' => 'User not found.'], 404);
    }
}
