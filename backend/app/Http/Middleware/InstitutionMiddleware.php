<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InstitutionMiddleware
{
    /**
     * Allow institutional accounts (banks, brokers, asset managers) and admins.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();
        if (! $user || ! in_array($user->role, ['institution', 'admin'], true)) {
            return response()->json(['message' => 'Unauthorized. Institutional access required.'], 403);
        }

        return $next($request);
    }
}
