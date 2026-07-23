@component('mail::message')
# Daily Financial Screening Batch Completed

The daily automated NGX market sweep and AAOIFI screening has finished processing.

**Batch Summary:**
- **Batch ID:** {{ $batchId }}
- **Total Companies Queued:** {{ $totalJobs }}
- **Processed Successfully:** {{ $processedJobs }}
- **Failed Jobs:** {{ $failedJobs }}

You can review the updated Market Data and AAOIFI Screenings live on the Irshad platform.

@component('mail::button', ['url' => config('app.url')])
Go to Dashboard
@endcomponent

Thanks,<br>
{{ config('app.name') }} AI Engine
@endcomponent
