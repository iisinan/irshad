<x-mail::message>
# Assalamu Alaikum, {{ $name }} 🌙

Here is your weekly summary of market movements and key updates for the Nigerian Exchange to help keep your portfolio on track.

---

### 📈 Your Portfolio & Watchlist Movement
*Here is a quick glance at how the assets you are tracking performed this week:*
@if(count($userPerformances) > 0)
@foreach($userPerformances as $perf)
* **{{ $perf['symbol'] }}**: {{ $perf['change_pct'] >= 0 ? 'Up' : 'Down' }} **{{ $perf['change_pct'] > 0 ? '+' : '' }}{{ number_format($perf['change_pct'], 2) }}%** (₦{{ number_format($perf['current_price'], 2) }})
@endforeach
@else
*You currently have no actively traded assets in your portfolio or watchlist this week.*
@endif

---

### 🚀 Top Market Gainers of the Week
*The best performing Shariah-compliant stocks this week:*
@foreach($topGainers as $idx => $perf)
{{ $idx + 1 }}. **{{ $perf['symbol'] }}**: **+{{ number_format($perf['change_pct'], 2) }}%**
@endforeach

---

### 📉 Top Market Losers of the Week
*The most significant declines among Shariah-compliant stocks:*
@foreach($topLosers as $idx => $perf)
{{ $idx + 1 }}. **{{ $perf['symbol'] }}**: **{{ number_format($perf['change_pct'], 2) }}%**
@endforeach

---

### 📅 Dividend Calendar Updates
*Important dividend announcements made this week:*
@if(count($dividendsThisWeek) > 0)
@foreach($dividendsThisWeek as $div)
* **{{ $div->company->symbol }}**: Announced a dividend of **₦{{ number_format($div->amount, 2) }}** per share (Qualification Date: {{ $div->record_date ? $div->record_date->format('M j, Y') : 'TBA' }}).
@endforeach
@else
*There were no new dividend announcements this week.*
@endif

---

<x-mail::button :url="$updatesUrl">
View Your Full Dashboard
</x-mail::button>

*You are receiving this email because you enabled the Weekly Digest in your Irshad notification preferences.*
*To unsubscribe, visit the Updates tab in your Irshad account and disable email delivery.*

Jazakallah Khair,
**The Irshad Team**
</x-mail::message>
