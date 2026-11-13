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

        $data = $query->latest()->paginate(20);

        return response()->json($data);
    }

    /**
     * Store an uploaded resource file on the public disk and return its URL.
     */
    private function storeUploadedFile(Request $request): ?string
    {
        if (! $request->hasFile('file')) {
            return null;
        }

        $path = $request->file('file')->store('resources', 'public');

        return rtrim($request->getSchemeAndHttpHost(), '/').'/storage/'.$path;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'scholar' => 'nullable|string|max:255',
            'type' => 'required|in:video,document',
            'url' => 'required_without:file|nullable|url',
            'file' => 'required_without:url|nullable|file|max:102400|mimes:mp4,mov,avi,webm,mkv,pdf,doc,docx,ppt,pptx',
            'duration' => 'nullable|string|max:50',
            'thumbnail' => 'nullable|url',
            'category' => 'nullable|string|max:255',
        ]);

        if ($uploadedUrl = $this->storeUploadedFile($request)) {
            $validated['url'] = $uploadedUrl;
        }
        unset($validated['file']);

        $resource = Resource::create($validated);

        return response()->json([
            'message' => 'Resource created successfully',
            'resource' => $resource,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $resource = Resource::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'scholar' => 'nullable|string|max:255',
            'type' => 'sometimes|required|in:video,document',
            'url' => 'sometimes|nullable|url',
            'file' => 'nullable|file|max:102400|mimes:mp4,mov,avi,webm,mkv,pdf,doc,docx,ppt,pptx',
            'duration' => 'nullable|string|max:50',
            'thumbnail' => 'nullable|url',
            'category' => 'nullable|string|max:255',
        ]);

        if ($uploadedUrl = $this->storeUploadedFile($request)) {
            $validated['url'] = $uploadedUrl;
        }
        unset($validated['file']);

        $resource->update($validated);

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
