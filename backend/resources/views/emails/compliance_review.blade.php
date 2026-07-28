<!DOCTYPE html>
<html>
<head>
    <title>New Compliance Review</title>
</head>
<body>
    <h2>New Compliance Review Pending</h2>
    <p>A new compliance status change has been flagged for review.</p>
    
    <ul>
        <li><strong>Company:</strong> {{ $review->company->name }} ({{ $review->company->symbol }})</li>
        <li><strong>Old Status:</strong> {{ $review->old_status ?? 'N/A' }}</li>
        <li><strong>New Status:</strong> {{ $review->new_status }}</li>
        <li><strong>Reason:</strong> {{ $review->reason }}</li>
    </ul>

    <p>Please log in to the admin panel to approve or reject this change.</p>
</body>
</html>
