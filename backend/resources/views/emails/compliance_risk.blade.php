<x-mail::message>
# ⚠️ Compliance Risk Warning for {{ $symbol }}

As-salamu alaykum, {{ $firstName }}!

You are receiving this alert because **{{ $symbol }}**, a stock on your Watchlist, is currently approaching the AAOIFI Shariah non-compliant thresholds based on its latest financial screening.

**Risk Factors:**
@foreach($riskReasons as $reason)
- {{ $reason }}
@endforeach

While the stock is currently still classified as **Halal**, please monitor it closely. If any of these ratios exceed their maximum limits in the next reporting cycle, the stock will be reclassified as Shariah Non-Compliant.

<x-mail::button :url="config('app.frontend_url') . '/market/' . $symbol">
View {{ $symbol }} Ratios
</x-mail::button>

To change your alert preferences, you can update them from your Watchlist on the Irshad dashboard.

May Allah keep your wealth pure and bless your investments.<br>
Jazakallah Khair,<br>
The Irshad Team
</x-mail::message>
