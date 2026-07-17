<?php

namespace App\Http\Controllers;

use App\Models\Favorite;
use App\Models\Product;
use App\Models\Company;
use App\Traits\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FavoriteController extends Controller
{
    use ApiResponder;

    /**
     * List user's favorites.
     */
    public function index(Request $request): JsonResponse
    {
        $favorites = Favorite::where('user_id', Auth::id())->get();
        
        $results = $favorites->map(function ($favorite) {
            if ($favorite->type === 'product') {
                $item = Product::with('ingredients')->find($favorite->reference_id);
            } else {
                $item = Company::with('status')->find($favorite->reference_id);
            }
            
            return [
                'id' => $favorite->id,
                'type' => $favorite->type,
                'reference_id' => $favorite->reference_id,
                'alert_whatsapp' => $favorite->alert_whatsapp,
                'alert_email' => $favorite->alert_email,
                'item' => $item,
            ];
        })->filter(fn($f) => $f['item'] !== null);

        return $this->success($results->values());
    }

    /**
     * Add an item to favorites.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:product,stock',
            'reference_id' => 'required|integer',
            'alert_whatsapp' => 'sometimes|boolean',
            'alert_email' => 'sometimes|boolean',
        ]);

        $exists = Favorite::where('user_id', Auth::id())
            ->where('type', $validated['type'])
            ->where('reference_id', $validated['reference_id'])
            ->exists();

        if ($exists) {
            return $this->error('Item already in favorites', 400);
        }

        $favorite = Favorite::create([
            'user_id' => Auth::id(),
            'type' => $validated['type'],
            'reference_id' => $validated['reference_id'],
            'alert_whatsapp' => $request->input('alert_whatsapp', false),
            'alert_email' => $request->input('alert_email', false),
        ]);

        return $this->success($favorite, 'Added to favorites', 201);
    }

    /**
     * Update an item in favorites.
     */
    public function update(Request $request, Favorite $favorite): JsonResponse
    {
        if ($favorite->user_id !== Auth::id()) {
            return $this->unauthorized();
        }

        $validated = $request->validate([
            'alert_whatsapp' => 'sometimes|boolean',
            'alert_email' => 'sometimes|boolean',
        ]);

        $favorite->update($validated);

        return $this->success($favorite, 'Favorite alerts updated');
    }

    /**
     * Remove an item from favorites.
     */
    public function destroy(Favorite $favorite): JsonResponse
    {
        if ($favorite->user_id !== Auth::id()) {
            return $this->unauthorized();
        }

        $favorite->delete();
        return $this->success(null, 'Removed from favorites');
    }
}
