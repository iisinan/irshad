<x-mail::layout>
{{-- Header --}}
<x-slot:header>
<x-mail::header :url="config('app.url')">
{{ config('app.name') }}
</x-mail::header>
</x-slot:header>

{{-- Body --}}
{!! $slot !!}

{{-- Subcopy --}}
@isset($subcopy)
<x-slot:subcopy>
<x-mail::subcopy>
{!! $subcopy !!}
</x-mail::subcopy>
</x-slot:subcopy>
@endisset

{{-- Footer --}}
<x-slot:footer>
<x-mail::footer>
© {{ date('Y') }} [Irshad](https://iirshad.com) · Shariah-Compliant Investing for Nigerian Muslims

[Visit Irshad](https://iirshad.com) &nbsp;·&nbsp; [Market](https://iirshad.com/market) &nbsp;·&nbsp; [Support](mailto:support@iirshad.com)
</x-mail::footer>
</x-slot:footer>
</x-mail::layout>
