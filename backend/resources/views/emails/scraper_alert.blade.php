<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .success { color: #16a34a; }
        .error { color: #dc2626; }
        .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-top: 20px; }
    </style>
</head>
<body>
    <h2 class="{{ $status === 'success' ? 'success' : 'error' }}">
        {{ $status === 'success' ? '✅ NGX Scraper Succeeded' : '🚨 NGX Scraper Failed' }}
    </h2>
    
    <p>The automated NGX EOD daily price scraper just completed a run.</p>
    
    <div class="card">
        <h3>Details:</h3>
        <pre style="white-space: pre-wrap; font-family: monospace;">{{ $details }}</pre>
    </div>
    
    <p style="margin-top: 30px; font-size: 0.85em; color: #6b7280;">
        This is an automated message from your Irshad Backend System.
    </p>
</body>
</html>
