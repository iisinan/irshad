@component('mail::message')
# <span style="color: #dc2626;">Not permissible</span>

**{{ $companyName }} ({{ $symbol }})**  
{{ $oldStatus }} &rarr; Not permissible &middot; {{ $date }}

<br>

**WHAT CHANGED**

{{ $symbol }}'s Shariah status changed from {{ $oldStatus }} to Haram based on newly published data.

@if($ratios)
<br>

**AAOIFI RATIOS**

<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
    <thead>
        <tr style="border-bottom: 2px solid #000;">
            <th style="text-align: left; padding: 8px 0; color: #6b7280; font-size: 12px; font-weight: bold; text-transform: uppercase;">Ratio</th>
            <th style="text-align: right; padding: 8px 0; color: #6b7280; font-size: 12px; font-weight: bold; text-transform: uppercase;">Value</th>
            <th style="text-align: right; padding: 8px 0; color: #6b7280; font-size: 12px; font-weight: bold; text-transform: uppercase;">Limit</th>
        </tr>
    </thead>
    <tbody>
        <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 0;">Debt / Market Cap</td>
            <td style="text-align: right; padding: 12px 0; color: {{ $ratios['debt'] > 30 ? '#dc2626' : '#16a34a' }}; font-weight: bold;">{{ number_format($ratios['debt'], 1) }}%</td>
            <td style="text-align: right; padding: 12px 0; color: #6b7280;">30%</td>
        </tr>
        <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 0;">Impure income / Revenue</td>
            <td style="text-align: right; padding: 12px 0; color: {{ $ratios['income'] > 5 ? '#dc2626' : '#16a34a' }}; font-weight: bold;">{{ number_format($ratios['income'], 2) }}%</td>
            <td style="text-align: right; padding: 12px 0; color: #6b7280;">5%</td>
        </tr>
        <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 0;">Cash & securities / Market Cap</td>
            <td style="text-align: right; padding: 12px 0; color: {{ $ratios['cash'] > 30 ? '#dc2626' : '#16a34a' }}; font-weight: bold;">{{ number_format($ratios['cash'], 1) }}%</td>
            <td style="text-align: right; padding: 12px 0; color: #6b7280;">30%</td>
        </tr>
    </tbody>
</table>
@endif

<br>

**WHAT TO DO**

@if($hasHolding)
We noticed you currently hold {{ $symbol }} in your portfolio. You should plan to exit your position. Scholars allow a grace period of approximately one reporting cycle (3 months) for an orderly exit. 

**A 90-day countdown has been added to your stock holding card on Irshad to help you track this grace period.** We will notify you again when the grace period expires.
@else
You should avoid purchasing {{ $symbol }}. If you happen to hold this stock elsewhere, scholars allow a grace period of approximately one reporting cycle (3 months) for an orderly exit.
@endif

- Do not buy additional shares
- Plan exit within one reporting cycle (~3 months)
- Donate any dividends received during the non-compliant period to Islamic charity
- Consult a qualified Shariah scholar if uncertain

@component('mail::button', ['url' => $actionUrl])
{{ $actionText }}
@endcomponent

May Allah bless your wealth and keep your finances pure.<br>
Jazakallah Khair, The Irshad Team
@endcomponent
