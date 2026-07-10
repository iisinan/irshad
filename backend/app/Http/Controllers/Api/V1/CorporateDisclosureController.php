<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CorporateDisclosure;

class CorporateDisclosureController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->query('limit', 50);
        $disclosures = CorporateDisclosure::orderBy('published_at', 'desc')
            ->limit($limit)
            ->get();
            
        return response()->json([
            'success' => true,
            'data' => $disclosures
        ]);
    }
}
