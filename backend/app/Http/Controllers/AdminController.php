<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\AdminAlert;
use App\Traits\ApiResponder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    use ApiResponder;

    /**
     * Get a paginated list of all users.
     */
    public function getUsers(Request $request)
    {
        $users = User::latest()->paginate(20);
        return response()->json($users);
    }

    /**
     * Create a new admin user.
     */
    public function createAdmin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'admin',
        ]);

        return response()->json([
            'message' => 'Admin account created successfully.',
            'user' => $user
        ], 201);
    }

    /**
     * Get all unresolved admin alerts.
     */
    public function getAlerts()
    {
        $alerts = AdminAlert::with('company')->where('resolved', false)->latest()->get();
        return $this->success($alerts);
    }

    /**
     * Mark an admin alert as resolved.
     */
    public function resolveAlert($id)
    {
        $alert = AdminAlert::findOrFail($id);
        $alert->update(['resolved' => true]);
        return $this->success(null, 'Alert resolved successfully');
    }
}
