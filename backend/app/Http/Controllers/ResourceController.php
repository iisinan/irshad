<?php

namespace App\Http\Controllers;

use App\Models\Resource;
use Illuminate\Http\Request;

class ResourceController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $type = $request->input('type', 'all');
        $page = $request->input('page', 1);

        $cacheKey = "resources_search_{$search}_type_{$type}_page_{$page}";

        $data = \Illuminate\Support\Facades\Cache::remember($cacheKey, now()->addHours(1), function () use ($search, $type) {
            $query = Resource::query();

            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('scholar', 'like', "%{$search}%");
                });
            }

            if ($type !== 'all') {
                $query->where('type', $type);
            }

            return $query->latest()->paginate(20);
        });

        return response()->json($data);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'scholar' => 'nullable|string|max:255',
            'type' => 'required|in:video,document',
            'url' => 'required|url',
            'duration' => 'nullable|string|max:50',
            'thumbnail' => 'nullable|url',
            'category' => 'nullable|string|max:255',
        ]);

        $resource = Resource::create($request->all());

        return response()->json([
            'message' => 'Resource created successfully',
            'resource' => $resource,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $resource = Resource::findOrFail($id);

        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'scholar' => 'nullable|string|max:255',
            'type' => 'sometimes|required|in:video,document',
            'url' => 'sometimes|required|url',
            'duration' => 'nullable|string|max:50',
            'thumbnail' => 'nullable|url',
            'category' => 'nullable|string|max:255',
        ]);

        $resource->update($request->all());

        return response()->json([
            'message' => 'Resource updated successfully',
            'resource' => $resource,
        ]);
    }

    public function destroy($id)
    {
        $resource = Resource::findOrFail($id);
        $resource->delete();

        return response()->json([
            'message' => 'Resource deleted successfully',
        ]);
    }
}
