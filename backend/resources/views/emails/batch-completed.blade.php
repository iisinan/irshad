@component('mail::message')
# Daily Market Screening Complete

As-salamu alaykum,

The automated NGX daily market sweep and AAOIFI Shariah screening has successfully completed. Below is a summary of this batch run.

**Batch Summary**

| | |
|---|---|
| **Batch ID** | {{ $batchId }} |
| **Total Companies Queued** | {{ $totalJobs }} |
| **Processed Successfully** | {{ $processedJobs }} |
| **Failed Jobs** | {{ $failedJobs }} |

All results are now live on the Irshad platform. You may review updated AAOIFI screenings and market data from the dashboard.

@component('mail::button', ['url' => config('app.frontend_url')])
Go to Dashboard
@endcomponent

Jazakallah Khair,
The Irshad Engine
@endcomponent
