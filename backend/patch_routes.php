<?php
$file = '/Users/sinan/Herd/irshad/backend/routes/api.php';
$content = file_get_contents($file);

$newRoute = <<<ROUTE
        // Utils
        Route::get('/utils/check-iframe', function (\Illuminate\Http\Request \$request) {
            \$url = \$request->query('url');
            if (!\$url) return response()->json(['can_iframe' => false]);
            try {
                // Use a short timeout context
                \$context = stream_context_create(['http' => ['method' => 'HEAD', 'timeout' => 2]]);
                \$headers = @get_headers(\$url, 1, \$context);
                if (!\$headers) return response()->json(['can_iframe' => false]);
                \$headers = array_change_key_case(\$headers, CASE_LOWER);
                
                \$xFrameOptions = \$headers['x-frame-options'] ?? null;
                if (\$xFrameOptions) {
                    \$val = is_array(\$xFrameOptions) ? end(\$xFrameOptions) : \$xFrameOptions;
                    if (in_array(strtolower(trim(\$val)), ['deny', 'sameorigin'])) {
                        return response()->json(['can_iframe' => false]);
                    }
                }
                \$csp = \$headers['content-security-policy'] ?? null;
                if (\$csp) {
                    \$val = is_array(\$csp) ? end(\$csp) : \$csp;
                    if (strpos(strtolower(\$val), 'frame-ancestors') !== false) {
                        return response()->json(['can_iframe' => false]);
                    }
                }
                return response()->json(['can_iframe' => true]);
            } catch (\Exception \$e) {
                return response()->json(['can_iframe' => false]);
            }
        });

        // ── Verified Protected Routes (Require Email Verification) ──
ROUTE;

$content = str_replace('// ── Verified Protected Routes (Require Email Verification) ──', $newRoute, $content);
file_put_contents($file, $content);
