<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #f5f5f5;
            margin: 0;
            padding: 0;
            color: #333;
        }
        .wrapper {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .header {
            background: #0f172a;
            padding: 28px 32px;
            text-align: center;
        }
        .header img { height: 44px; width: auto; }
        .status-banner {
            padding: 20px 32px;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: -0.2px;
        }
        .status-banner.success { background: #ecfdf5; color: #065f46; border-bottom: 3px solid #10b981; }
        .status-banner.error   { background: #fef2f2; color: #991b1b; border-bottom: 3px solid #ef4444; }
        .body { padding: 28px 32px; }
        .body p { font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 16px; }
        .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px 24px;
            margin-top: 16px;
        }
        .card h3 {
            margin: 0 0 12px;
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #94a3b8;
        }
        pre {
            white-space: pre-wrap;
            font-family: monospace;
            font-size: 13px;
            color: #334155;
            margin: 0;
            line-height: 1.6;
        }
        .footer {
            background: #f8fafc;
            padding: 18px 32px;
            font-size: 12px;
            color: #94a3b8;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
<div class="wrapper">

    <div class="header">
        <img src="https://iirshad.com/logo.svg" alt="Irshad" />
    </div>

    <div class="status-banner {{ $status === 'success' ? 'success' : 'error' }}">
        {{ $status === 'success' ? '✅ NGX Price Scraper — Run Successful' : '🚨 NGX Price Scraper — Run Failed' }}
    </div>

    <div class="body">
        <p>
            The automated NGX end-of-day price scraper just completed a run.
            {{ $status === 'success' ? 'All prices have been updated successfully.' : 'One or more errors were encountered. Please review the details below.' }}
        </p>

        <div class="card">
            <h3>Run Details</h3>
            <pre>{{ $details }}</pre>
        </div>
    </div>

    <div class="footer">
        This is an automated message from the Irshad Backend System. Please do not reply to this email.
    </div>

</div>
</body>
</html>
