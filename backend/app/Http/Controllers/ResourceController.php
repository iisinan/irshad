<?php

namespace App\Http\Controllers;

use App\Models\Resource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
     * Store an uploaded resource file in Cloudflare R2 (s3 disk) and return its stable media URL.
     */
    private function storeUploadedFile(Request $request): ?string
    {
        if (! $request->hasFile('file')) {
            return null;
        }

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'bin');
        $filename = Str::random(40).'.'.$ext;

        Storage::disk('s3')->putFileAs('resources', $file, $filename, [
            'ContentType' => $file->getMimeType() ?: 'application/octet-stream',
        ]);

        return rtrim($request->getSchemeAndHttpHost(), '/').'/api/v1/resources/media/'.$filename;
    }

    /**
     * Remove a previously uploaded R2 resource file if the URL points to our media endpoint.
     */
    private function deleteManagedMedia(?string $url): void
    {
        if (! $url || ! preg_match('#/api/v1/resources/media/([A-Za-z0-9._-]+)$#', $url, $matches)) {
            return;
        }

        Storage::disk('s3')->delete('resources/'.$matches[1]);
    }

    /**
     * Redirect requests for uploaded R2 resource files to a fresh presigned URL.
     */
    public function media(string $filename)
    {
        if (! preg_match('/^[A-Za-z0-9._-]+$/', $filename)) {
            abort(404);
        }

        $key = 'resources/'.$filename;
        if (! Storage::disk('s3')->exists($key)) {
            abort(404);
        }

        $signedUrl = Storage::disk('s3')->temporaryUrl($key, now()->addHours(6));

        return redirect()->away($signedUrl, 302);
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
            $this->deleteManagedMedia($resource->url);
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
        $this->deleteManagedMedia($resource->url);
        $resource->delete();

        return response()->json([
            'message' => 'Resource deleted successfully',
        ]);
    }
}
