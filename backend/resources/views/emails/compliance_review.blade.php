<!DOCTYPE html>
<html>
<head>
    <title>Compliance Status Change — Admin Review Required</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #1a1a2e; color: #ffffff; padding: 28px 32px; }
        .header h1 { margin: 0; font-size: 20px; }
        .header p  { margin: 6px 0 0; color: #aaaacc; font-size: 13px; }
        .body { padding: 28px 32px; }
        .badge-halal     { display: inline-block; background: #d4edda; color: #155724; padding: 3px 10px; border-radius: 12px; font-size: 13px; font-weight: bold; }
        .badge-non-halal { display: inline-block; background: #f8d7da; color: #721c24; padding: 3px 10px; border-radius: 12px; font-size: 13px; font-weight: bold; }
        .badge-unknown   { display: inline-block; background: #e2e3e5; color: #383d41; padding: 3px 10px; border-radius: 12px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        td { padding: 10px 14px; border-bottom: 1px solid #eeeeee; font-size: 14px; }
        td:first-child { font-weight: bold; color: #555555; width: 40%; }
        .reason-box { background: #f9f9f9; border-left: 4px solid #6c757d; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #444; margin: 16px 0; line-height: 1.6; }
        .actions { display: flex; gap: 12px; margin-top: 28px; }
        .btn-approve { flex: 1; background: #28a745; color: #ffffff; text-align: center; padding: 14px; border-radius: 6px; font-size: 15px; font-weight: bold; text-decoration: none; }
        .btn-reject  { flex: 1; background: #dc3545; color: #ffffff; text-align: center; padding: 14px; border-radius: 6px; font-size: 15px; font-weight: bold; text-decoration: none; }
        .footer { background: #f5f5f5; padding: 16px 32px; font-size: 12px; color: #999999; text-align: center; }
    </style>
</head>
<body>
<div class="wrapper">

    <div class="header">
        <h1>⚠️ Shariah Status Change Detected</h1>
        <p>A stock has been flagged for compliance review. No changes have been applied to the live app yet.</p>
    </div>

    <div class="body">

        <table>
            <tr>
                <td>Company</td>
                <td><strong>{{ $review->company->name ?? 'Unknown' }} ({{ $review->company->symbol ?? 'N/A' }})</strong></td>
            </tr>
            <tr>
                <td>Previous Status</td>
                <td>
                    @if($review->old_status === 'halal')
                        <span class="badge-halal">✅ Halal</span>
                    @elseif($review->old_status === 'non-halal')
                        <span class="badge-non-halal">❌ Non-Halal</span>
                    @else
                        <span class="badge-unknown">{{ $review->old_status ?? 'None (New)' }}</span>
                    @endif
                </td>
            </tr>
            <tr>
                <td>Proposed New Status</td>
                <td>
                    @if($review->new_status === 'halal')
                        <span class="badge-halal">✅ Halal</span>
                    @elseif($review->new_status === 'non-halal')
                        <span class="badge-non-halal">❌ Non-Halal</span>
                    @else
                        <span class="badge-unknown">{{ $review->new_status }}</span>
                    @endif
                </td>
            </tr>
            <tr>
                <td>Flagged At</td>
                <td>{{ $review->created_at ? $review->created_at->format('D, d M Y H:i') . ' UTC' : 'N/A' }}</td>
            </tr>
        </table>

        <p style="font-size:13px; font-weight:bold; margin-bottom: 6px;">Reasoning:</p>
        <div class="reason-box">{{ $review->reason }}</div>

        <p style="font-size: 13px; color: #555;">
            Click <strong>Approve</strong> to apply the status change to the live app immediately, or <strong>Reject</strong> to keep the current status unchanged.
        </p>

        <div class="actions">
            <a href="{{ config('app.url') }}/api/admin/compliance-reviews/{{ $review->id }}/approve-link" class="btn-approve">✅ Approve Change</a>
            <a href="{{ config('app.url') }}/api/admin/compliance-reviews/{{ $review->id }}/reject-link"  class="btn-reject">❌ Reject &amp; Keep Current</a>
        </div>

        <p style="font-size: 11px; color: #aaa; margin-top: 16px;">
            Or log into the Admin Dashboard → Compliance Reviews to review with full context.
        </p>

    </div>

    <div class="footer">
        This email was sent by the Irshad Engine. Do not reply to this email.
    </div>

</div>
</body>
</html>
