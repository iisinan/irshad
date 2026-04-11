<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Traits\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    use ApiResponder;

    /**
     * Scan barcode and return product details.
     */
    public function scan(Request $request): JsonResponse
    {
        $request->validate([
            'barcode' => 'required|string',
        ]);

        $product = Product::with('ingredients')->where('barcode', $request->barcode)->first();

        if (!$product) {
            return $this->error('Product not found in our database. You can submit it for review.', 404);
        }

        return $this->success($product, 'Product found');
    }

    /**
     * Fetch product by barcode.
     */
    public function showByBarcode(string $barcode): JsonResponse
    {
        $product = Product::with('ingredients')->where('barcode', $barcode)->firstOrFail();
        return $this->success($product);
    }

    /**
     * Search products by name or brand.
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->get('q');
        
        $products = Product::where('name', 'LIKE', "%{$query}%")
            ->orWhere('brand', 'LIKE', "%{$query}%")
            ->limit(10)
            ->get();

        return $this->success($products);
    }

    /**
     * Update product status (Scholar/Admin only).
     */
    public function updateStatus(Request $request, Product $product): JsonResponse
    {
        // Check if user is scholar or admin
        if (!in_array($request->user()->role, ['admin', 'scholar'])) {
            return $this->unauthorized('Only scholars or admins can update status');
        }

        $validated = $request->validate([
            'status' => 'required|in:halal,non-halal,doubtful',
            'status_reason' => 'required|string',
        ]);

        $product->update([
            'status' => $validated['status'],
            'status_reason' => $validated['status_reason'],
            'verified_by_scholar' => true,
        ]);

        // Audit log (Phase 1Requirement)
        // ... (Audit Log logic)

        return $this->success($product, 'Product status updated and verified.');
    }
}
