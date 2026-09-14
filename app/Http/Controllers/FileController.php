<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    /**
     * Serve a file from private R2 storage via a temporary signed URL.
     *
     * Redirects to a temporary URL that expires after 10 minutes,
     * ensuring files are not permanently accessible via public links.
     */
    public function show(Request $request, string $disk, string $path): RedirectResponse
    {
        // Validate the disk to prevent path traversal to other disks
        if (! in_array($disk, ['r2'])) {
            abort(404);
        }

        if (! Storage::disk($disk)->exists($path)) {
            abort(404);
        }

        // Redirect to a temporary URL that expires in 10 minutes
        return redirect()->away(
            Storage::disk($disk)->temporaryUrl($path, now()->addMinutes(10))
        );
    }
}
