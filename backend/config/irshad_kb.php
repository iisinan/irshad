<?php

return [
    'aaoifi_methodology' => [
        'keywords' => ['aaoifi', 'halal', 'haram', 'questionable', 'debt', 'cash', 'impermissible', 'interest', 'riba', 'ratio', 'screen', 'screening', 'compliant', 'methodology', 'standard'],
        'title' => 'AAOIFI Shariah Screening Methodology (Standard No. 21)',
        'content' => <<<'TEXT'
Irshad screens Nigerian Exchange (NGX) equities using AAOIFI Shariah Standard No. 21 across two stages:
1. Qualitative Business Activity Screen: Excludes companies whose core revenue comes from prohibited activities (conventional banking/interest lending, conventional insurance, alcohol, pork/non-halal meat, gambling, tobacco, adult entertainment, prohibited weapons).
2. Quantitative Financial Ratio Screen:
   - Conventional interest-bearing debt to 36-month average market capitalization (or trailing market cap) must be < 30%.
   - Interest-bearing deposits & cash securities to market cap must be < 30%.
   - Impermissible (non-compliant / interest) revenue to total revenue must be < 5%.
If a company passes business activity and all ratios cleanly, it is marked Halal. If financials are incomplete or ratios sit in a grey/review state pending verification, it may be marked Questionable; if any threshold or core activity fails, it is Non-Compliant (Haram). Always note whether scholar verification is present when citing a stock's DB status.
TEXT,
    ],

    'purification' => [
        'keywords' => ['purify', 'purification', 'dividend', 'cleanse', 'cleansing', 'impermissible', 'tainted', 'charity'],
        'title' => 'Dividend & Capital Gains Purification',
        'content' => <<<'TEXT'
Dividend Purification removes the small percentage (< 5%) of impermissible income embedded in an otherwise Halal company's earnings:
- Open the Purification tab in your Portfolio to record dividends or run calculations for eligible holdings.
- Irshad multiplies the company's impermissible income ratio by your dividend (or proportional holding) to tell you the exact amount to donate to charity without expecting spiritual reward for it (purely cleansing wealth).
- Capital gains from selling Halal shares generally do not require purification unless specifically flagged for a stock entering non-compliance during a grace period.
TEXT,
    ],

    'zakat_hawl' => [
        'keywords' => ['zakat', 'hawl', 'nisab', 'anniversary', 'date', 'gold', 'silver', '2.5'],
        'title' => 'Zakat Calculation & Hawl Date Tracking',
        'content' => <<<'TEXT'
Irshad supports annual Zakat calculation (2.5% rate once wealth remains above Nisab for one full lunar year / Hawl):
- Set your Hawl date once in Profile/Zakat settings (or when prompted for your first holding if you haven't set one yet); it applies across your portfolio so you don't need to re-enter it every time.
- Live Nisab thresholds (gold & silver benchmarks) and Zakat calculation are available in Portfolio -> Zakat.
- Long-term buy-and-hold equity vs active trading stock approaches can affect zakatable base; Irshad follows standard Islamic finance equity Zakat methodology shown in the Zakat calculator breakdown.
TEXT,
    ],

    'platform_features' => [
        'keywords' => ['portfolio', 'holding', 'watchlist', 'alert', 'basket', 'directory', 'resource', 'video', 'statement', 'export', 'add stock'],
        'title' => 'Using Irshad Features',
        'content' => <<<'TEXT'
- Holdings: Add NGX stocks you own, track compliance drift alerts, and view portfolio Halal health.
- Market Screener: Search and screen any NGX stock for AAOIFI compliance breakdown and AI financial summary.
- Investing Baskets & Halal Directory: Explore curated Shariah-compliant themes/baskets and vetted Islamic financial institutions.
- Educational Resources: Watch scholarly videos and read AAOIFI documents under Portfolio -> Resources.
- Alerts / Watchlist: Receive compliance change and price alerts when enabled for your plan.
TEXT,
    ],

    'account_billing' => [
        'keywords' => ['plan', 'pricing', 'upgrade', 'pro', 'max', 'miftah', 'noor', 'free', 'billing', 'payment', 'squad', 'subscription', 'cancel', 'password', 'verify', 'email', 'login', 'bug', 'error', 'support', 'human', 'admin'],
        'title' => 'Account, Plans, Billing & Support',
        'content' => <<<'TEXT'
- Plans: Miftah (Free) includes limited monthly stock screens and portfolio holdings; paid plans (Pro / Max) unlock higher or unlimited screening, purification, Zakat calculator, watchlist/drift alerts, and statements. Users can compare or upgrade under Pricing Plans.
- Verification & Password Reset: If a user experiences login, email verification, or unexpected password-reset issues, advise them to check account security, avoid clicking unrecognized links, and offer escalation to the Irshad Support Team if they need an admin check.
- Billing disputes, missing stocks, or technical bugs: Encourage escalating the conversation to the Irshad Support Team so an admin can review directly in Admin Inbox.
TEXT,
    ],
];
