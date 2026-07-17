<?php

namespace App\Http\Controllers;

use App\Models\Resource;
use Illuminate\Http\Request;

class ResourceController extends Controller
{
    public function index(Request $request)
    {
        $query = Resource::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('scholar', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type') && $request->input('type') !== 'all') {
            $query->where('type', $request->input('type'));
        }

        // Return latest resources first, paginated
        return response()->json(
            $query->latest()->paginate(20)
        );
    }
}
