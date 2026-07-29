<x-mail::message>
# Assalamu Alaikum, {{ $name }}

Here is your weekly summary of Shariah compliance updates, business activities, and market intelligence for the companies in your portfolio and watchlist.

## 🛡️ Compliance Changes
We have detected changes in the Shariah compliance status of some companies on the NGX. Please review your holdings.

<x-mail::button :url="$updatesUrl">
Review Compliance Updates
</x-mail::button>

## 📊 Market Intelligence
Catch up on the latest earnings, dividend declarations, and AAOIFI screening insights from this week.

<x-mail::button :url="$updatesUrl">
Read Market News
</x-mail::button>

---
*You are receiving this because you enabled the Weekly Digest in your Updates preferences. To unsubscribe, visit the Updates Tab in the Irshad app and disable email delivery.*

Jazakallah Khair,<br>
{{ config('app.name') }}
</x-mail::message>
