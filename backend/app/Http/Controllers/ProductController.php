<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Traits\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Http;

class ProductController extends Controller
{
    use ApiResponder;

    /**
     * Get all products (Admin/Scholar).
     */
    public function index(Request $request): JsonResponse
    {
        // Check if user is scholar or admin
        if (!in_array($request->user()->role, ['admin', 'scholar'])) {
            return $this->unauthorized('Only scholars or admins can view all products list.');
        }

        // Prioritize doubtful products
        $products = Product::orderByRaw("CASE WHEN status = 'doubtful' THEN 1 ELSE 2 END")
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return $this->success($products);
    }

    /**
     * Scan barcode and return product details.
     */
    public function scan(Request $request): JsonResponse
    {
        $request->validate([
            'barcode' => 'required|string',
        ]);

        $barcode = $request->barcode;
        $product = Product::with('ingredients')->where('barcode', $barcode)->first();

        // If found locally, return immediately
        if ($product) {
            return $this->success($product, 'Product found locally');
        }

        // Fallback to OpenFoodFacts
        try {
            $response = Http::timeout(10)->get("https://world.openfoodfacts.org/api/v0/product/{$barcode}.json");
            
            if ($response->successful() && $response->json('status') === 1) {
                $productData = $response->json('product');
                
                $ingredientsText = $productData['ingredients_text_en'] 
                    ?? $productData['ingredients_text'] 
                    ?? null;
                
                $statusData = $this->analyzeHalalStatus($ingredientsText);
                
                $product = Product::create([
                    'barcode' => $barcode,
                    'name' => $productData['product_name'] ?? 'Unknown Product',
                    'brand' => $productData['brands'] ?? null,
                    'image_url' => $productData['image_url'] ?? null,
                    'ingredients_text' => $ingredientsText,
                    'status' => $statusData['status'],
                    'status_reason' => $statusData['reason'],
                    'verified_by_scholar' => false, // Needs manual verification if doubtful
                ]);

                return $this->success($product, 'Product found via OpenFoodFacts and auto-screened');
            }
        } catch (\Exception $e) {
            // Silently ignore HTTP errors and fallback to not found
        }

        return $this->error('Product not found in our database or global registry. You can submit it for review.', 404);
    }

    /**
     * Analyze ingredients text to determine preliminary Halal status.
     */
    private function analyzeHalalStatus(?string $ingredientsText): array
    {
        if (empty($ingredientsText)) {
            return [
                'status' => 'doubtful',
                'reason' => 'No ingredients listed. Status cannot be verified automatically.'
            ];
        }

        $text = strtolower($ingredientsText);

        $haramKeywords = [
            'pork', 'lard', 'bacon', 'ham', 'swine', 'porcine', 
            'gelatin', 'gelatine', 'carmine', 'cochineal', 'e120', 
            'wine', 'beer', 'rum', 'alcohol', 'liqueur', 'brandy'
        ];

        $doubtfulKeywords = [
            'e471', 'e472', 'mono- and diglycerides', 'monoglycerides', 'diglycerides',
            'rennet', 'pepsin', 'whey', 'shortening', 'glycerin', 'glycerol', 'stearic acid'
        ];

        $foundHaram = [];
        foreach ($haramKeywords as $keyword) {
            if (str_contains($text, $keyword)) {
                $foundHaram[] = $keyword;
            }
        }

        if (!empty($foundHaram)) {
            return [
                'status' => 'non-halal',
                'reason' => 'Contains strictly prohibited ingredients: ' . implode(', ', $foundHaram)
            ];
        }

        $foundDoubtful = [];
        foreach ($doubtfulKeywords as $keyword) {
            if (str_contains($text, $keyword)) {
                $foundDoubtful[] = $keyword;
            }
        }

        if (!empty($foundDoubtful)) {
            return [
                'status' => 'doubtful',
                'reason' => 'Contains ambiguous ingredients that require scholar verification: ' . implode(', ', $foundDoubtful)
            ];
        }

        return [
            'status' => 'halal',
            'reason' => 'No prohibited or doubtful ingredients detected by automatic screening.'
        ];
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

        $oldStatus = $product->getOriginal('status');
        
        $product->update([
            'status' => $validated['status'],
            'status_reason' => $validated['status_reason'],
            'verified_by_scholar' => true,
        ]);

        // Audit log
        \App\Models\AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'override_product_status',
            'target_type' => Product::class,
            'target_id' => $product->id,
            'changes' => [
                'old_status' => $oldStatus,
                'new_status' => $validated['status'],
                'reason' => $validated['status_reason']
            ]
        ]);

        return $this->success($product, 'Product status updated and verified.');
    }

    /**
     * Submit a new product for review.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'brand' => 'nullable|string|max:255',
            'barcode' => 'required|string|max:255|unique:products,barcode',
            'ingredients_text' => 'nullable|string',
            'image' => 'nullable|image|max:5120', // Max 5MB
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
        }

        $product = Product::create([
            'name' => $validated['name'],
            'brand' => $validated['brand'],
            'barcode' => $validated['barcode'],
            'status' => 'doubtful', // Pending review
            'status_reason' => 'Submitted by user, pending scholar review.',
            'verified_by_scholar' => false,
            'metadata' => [
                'ingredients_text' => $validated['ingredients_text'] ?? null,
                'submitted_by' => $request->user()->id,
                'image_path' => $imagePath,
            ]
        ]);

        return $this->success($product, 'Product submitted successfully', 201);
    }
}
