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
    /**
     * Update user details (admin only).
     */
    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'sometimes|string|in:admin,user',
            'plan' => 'sometimes|string|in:free,paid',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->update($request->only(['name', 'email', 'role', 'plan']));

        return $this->success($user, 'User updated successfully');
    }

    /**
     * Delete a user (admin only).
     */
    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        
        // Prevent deleting yourself
        if (auth()->id() === $user->id) {
            return response()->json(['message' => 'Cannot delete your own account'], 403);
        }

        $user->delete();
        return $this->success(null, 'User deleted successfully');
    }

    /**
     * Update Ticker About Info (admin only).
     */
    public function updateTickerAbout(Request $request, $symbol)
    {
        $company = \App\Models\Company::where('symbol', $symbol)->firstOrFail();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'sector' => 'sometimes|string|max:255',
            'industry' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'overview' => 'sometimes|nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $company->update($request->only(['name', 'sector', 'industry', 'description', 'overview']));

        \Illuminate\Support\Facades\Cache::forget("stocks.show.{$symbol}");

        return $this->success($company, 'Company details updated successfully');
    }

    /**
     * Add News to a Ticker (admin only).
     */
    public function addTickerNews(Request $request, $symbol)
    {
        $company = \App\Models\Company::where('symbol', $symbol)->firstOrFail();

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'url' => 'required|url',
            'source' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $news = \App\Models\News::create([
            'company_id' => $company->id,
            'title' => $request->title,
            'url' => $request->url,
            'source' => $request->source,
            'published_at' => now(),
        ]);

        \Illuminate\Support\Facades\Cache::forget("stocks.show.{$symbol}");

        return $this->success($news, 'News added successfully');
    }

    /**
     * Delete News from a Ticker (admin only).
     */
    public function deleteTickerNews($symbol, $newsId)
    {
        $company = \App\Models\Company::where('symbol', $symbol)->firstOrFail();
        $news = \App\Models\News::where('id', $newsId)->where('company_id', $company->id)->firstOrFail();
        
        $news->delete();

        \Illuminate\Support\Facades\Cache::forget("stocks.show.{$symbol}");

        return $this->success(null, 'News deleted successfully');
    }
}
