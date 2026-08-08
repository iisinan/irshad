<!DOCTYPE html>
<html>
<head>
    <title>Shariah Status Change — Admin Review Required</title>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .wrapper {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        /* Header */
        .header {
            background: #0f172a;
            padding: 28px 32px;
            text-align: center;
        }
        .header img { height: 44px; width: auto; }
        /* Alert banner */
        .alert-banner {
            background: #fffbeb;
            border-bottom: 3px solid #f59e0b;
            padding: 20px 32px;
        }
        .alert-banner h1 {
            margin: 0 0 4px;
            font-size: 18px;
            font-weight: 700;
            color: #92400e;
        }
        .alert-banner p {
            margin: 0;
            font-size: 13px;
            color: #b45309;
        }
        /* Body */
        .body { padding: 28px 32px; }
        table { width: 100%; border-collapse: collapse; margin: 0 0 24px; }
        td {
            padding: 12px 14px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
            color: #475569;
            vertical-align: top;
        }
        td:first-child { font-weight: 600; color: #1e293b; width: 38%; }
        /* Badges */
        .badge {
            display: inline-block;
            padding: 3px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.3px;
        }
        .badge-halal     { background: #dcfce7; color: #166534; }
        .badge-non-halal { background: #fee2e2; color: #991b1b; }
        .badge-doubtful  { background: #fef3c7; color: #92400e; }
        .badge-unknown   { background: #f1f5f9; color: #475569; }
        /* Reasoning */
        .label {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #94a3b8;
            margin-bottom: 8px;
        }
        .reason-box {
            background: #f8fafc;
            border-left: 4px solid #6366f1;
            padding: 14px 18px;
            border-radius: 0 8px 8px 0;
            font-size: 14px;
            color: #334155;
            line-height: 1.7;
            margin-bottom: 28px;
        }
        /* Instructions */
        .instructions {
            font-size: 14px;
            color: #475569;
            line-height: 1.6;
            margin-bottom: 24px;
        }
        .instructions strong { color: #1e293b; }
        /* Action buttons */
        .actions {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
        }
        .btn {
            flex: 1;
            text-align: center;
            padding: 14px 20px;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 700;
            text-decoration: none;
            letter-spacing: 0.2px;
        }
        .btn-approve { background: #10b981; color: #ffffff; }
        .btn-reject  { background: #ef4444; color: #ffffff; }
        .hint {
            font-size: 12px;
            color: #94a3b8;
            text-align: center;
            margin-top: 4px;
        }
        /* Footer */
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

    <!-- Logo Header -->
    <div class="header">
        <img src="https://iirshad.com/logo.svg" alt="Irshad" />
    </div>

    <!-- Alert Banner -->
    <div class="alert-banner">
        <h1>⚠️ Shariah Status Change Detected</h1>
        <p>A stock has been flagged for compliance review. No changes have been applied to the live app yet — your action is required.</p>
    </div>

    <!-- Body -->
    <div class="body">

        <table>
            <tr>
                <td>Company</td>
                <td><strong>{{ $review->company?->name ?? 'Unknown' }}</strong> &nbsp;<span style="color:#94a3b8;">({{ $review->company?->symbol ?? 'N/A' }})</span></td>
            </tr>
            <tr>
                <td>Previous Status</td>
                <td>
                    @if($review->old_status === 'halal')
                        <span class="badge badge-halal">✅ Halal</span>
                    @elseif($review->old_status === 'non-halal')
                        <span class="badge badge-non-halal">❌ Non-Halal</span>
                    @elseif($review->old_status === 'doubtful')
                        <span class="badge badge-doubtful">⚠️ Doubtful</span>
                    @else
                        <span class="badge badge-unknown">{{ $review->old_status ?? 'None (New Entry)' }}</span>
                    @endif
                </td>
            </tr>
            <tr>
                <td>Proposed New Status</td>
                <td>
                    @if($review->new_status === 'halal')
                        <span class="badge badge-halal">✅ Halal</span>
                    @elseif($review->new_status === 'non-halal')
                        <span class="badge badge-non-halal">❌ Non-Halal</span>
                    @elseif($review->new_status === 'doubtful')
                        <span class="badge badge-doubtful">⚠️ Doubtful</span>
                    @else
                        <span class="badge badge-unknown">{{ $review->new_status }}</span>
                    @endif
                </td>
            </tr>
            <tr>
                <td>Flagged At</td>
                <td style="color:#64748b;">{{ $review->created_at ? $review->created_at->format('D, d M Y · H:i') . ' UTC' : 'N/A' }}</td>
            </tr>
        </table>

        <div class="label">Screening Rationale</div>
        <div class="reason-box">{{ $review->reason }}</div>

        <p class="instructions">
            Click <strong>Approve</strong> to apply the new status to the live app immediately, or <strong>Reject</strong> to keep the current status unchanged and dismiss this review.
        </p>

        <div class="actions">
            <a href="{{ config('app.url') }}/api/v1/admin/compliance-reviews/{{ $review->id }}/approve-link" class="btn btn-approve">✅ &nbsp;Approve Change</a>
            <a href="{{ config('app.url') }}/api/v1/admin/compliance-reviews/{{ $review->id }}/reject-link"  class="btn btn-reject">❌ &nbsp;Reject &amp; Keep Current</a>
        </div>

        <p class="hint">Or log in to the <a href="{{ config('app.frontend_url') }}/admin/compliance-reviews" style="color:#6366f1;">Admin Dashboard → Compliance Reviews</a> to review with full context and history.</p>

    </div>

    <!-- Footer -->
    <div class="footer">
        This email was sent automatically by the Irshad Compliance Engine. Please do not reply to this email.
    </div>

</div>
</body>
</html>
