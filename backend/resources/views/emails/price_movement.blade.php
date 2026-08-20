<x-mail::message>
# {{ $direction === 'up' ? '📈' : '📉' }} Price Movement Alert for {{ $symbol }}

As-salamu alaykum, {{ $firstName }}!

You are receiving this alert because **{{ $symbol }}**, a stock on your Watchlist, has experienced a significant price movement today.

**{{ $symbol }}** is **{{ $direction }} by {{ number_format($changePct, 2) }}%** today, bringing the current price to **₦{{ number_format($currentPrice, 2) }}**.

<x-mail::button :url="config('app.frontend_url') . '/market/' . $symbol">
View {{ $symbol }} Chart
</x-mail::button>

To change your alert preferences, you can update them from your Watchlist on the Irshad dashboard.

May Allah bless your investments.<br>
Jazakallah Khair,<br>
The Irshad Team
</x-mail::message>
