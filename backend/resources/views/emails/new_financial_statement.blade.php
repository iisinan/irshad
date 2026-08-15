<!DOCTYPE html>
<html>
<head>
    <title>New Financial Statement Alert</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <h2 style="color: #00D68F;">New Financial Statement Released!</h2>
    <p>Hello,</p>
    <p>A new financial statement has been released for one of the stocks we track.</p>
    
    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Company:</strong> {{ $company->name }} ({{ $company->symbol }})</p>
        <p><strong>Title:</strong> {{ $disclosureTitle }}</p>
        @if($pdfUrl)
            <p><strong>PDF Link:</strong> <a href="{{ $pdfUrl }}" target="_blank" style="color: #3B82F6;">View Document</a></p>
        @else
            <p><strong>PDF Link:</strong> Not provided</p>
        @endif
    </div>

    <p>The NGXPulse scraper identified this as a new statement based on its publication date and SHA-256 hash.</p>
    
    <p>Best regards,<br>Irshad AI System</p>
</body>
</html>
