<x-mail::message>
# As-salamu alaykum, {{ $firstName }}!

Welcome to **Irshad Institutional** — your Shariah portfolio screening, compliance auditing, and factsheet platform for **{{ $institutionName }}** ({{ $institutionType }}).

Your institutional account is active and verified with immediate access to:

- **AAOIFI Portfolio & Mandate Screening:** Screen equity books, ETFs, and mixed mandates against AAOIFI Standard No. 21 business and financial ratio thresholds with drift & concentration alerts.
- **Branded Summaries & 7-Section Factsheets:** Generate print-ready 1-Page Summaries, 7-Section Fact Sheets, and per-unit purification & indicative Zakat schedules.
- **B2B Integration & API Keys:** Create institutional API keys in-portal to embed Irshad screening and compliance outputs into your workflows.

**Account Details**
- **Organization:** {{ $institutionName }}
- **Login Email:** {{ $userEmail }}
- **Sign-In Page:** [{{ $loginUrl }}]({{ $loginUrl }})

<x-mail::button :url="$institutionUrl">
Open Institutional Portal
</x-mail::button>

If you need assistance onboarding your team or importing holdings, simply reply to this email and the Irshad Institutional Desk will assist right away.

May Allah keep your wealth pure and bless your stewardship.<br>
Jazakallah Khair,<br>
**The Irshad Team**
</x-mail::message>
