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
