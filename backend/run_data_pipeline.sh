#!/bin/bash
# run_data_pipeline.sh
# Full data completeness pipeline for NGX stocks.
# Run from: /Users/sinan/Herd/irshad/backend

set -e
cd "$(dirname "$0")"

echo "================================================"
echo " IRSHAD Data Completeness Pipeline"
echo "================================================"

# Step 1: Export ticker list from DB
echo ""
echo "📋 Step 1: Exporting ticker list..."
php export_ticker_list.php

# Step 2: Fetch all data from Yahoo Finance
echo ""
echo "📡 Step 2: Fetching data from Yahoo Finance..."
echo "   (This will take ~2-5 minutes for 234 stocks)"
source venv/bin/activate 2>/dev/null || python3 -m venv venv && source venv/bin/activate
pip install -q yfinance 2>/dev/null || true
python3 scripts/fetch_yahoo_data.py all_tickers.txt > yahoo_data.json
echo "   Yahoo fetch complete. $(python3 -c "import json; d=json.load(open('yahoo_data.json')); found=sum(1 for v in d.values() if not v.get('error')); print(f'{found} stocks found on Yahoo Finance.')")"

# Step 3: Apply Yahoo data to DB
echo ""
echo "💾 Step 3: Saving Yahoo Finance data to DB..."
php update_from_yahoo.php yahoo_data.json

# Step 4: Generate overviews via Gemini for remaining companies
echo ""
echo "🤖 Step 4: Generating AI overviews for remaining companies..."
php export_ticker_list.php  # Re-export to get updated missing_overviews.json
MISSING_COUNT=$(python3 -c "import json; d=json.load(open('missing_overviews.json')); print(len(d))")
if [ "$MISSING_COUNT" -gt "0" ]; then
    echo "   $MISSING_COUNT companies still need overviews — calling Gemini..."
    GEMINI_API_KEY=$(php -r "require 'vendor/autoload.php'; \$app=require'bootstrap/app.php'; \$app->make('Illuminate\\Contracts\\Console\\Kernel')->bootstrap(); echo env('GEMINI_API_KEY');")
    GEMINI_API_KEY="$GEMINI_API_KEY" python3 scripts/generate_overviews_gemini.py missing_overviews.json > gemini_overviews.json
    php fill_overviews_from_json.php gemini_overviews.json
else
    echo "   All companies have overviews — skipping Gemini step."
fi

# Step 5: Fill missing logos
echo ""
echo "🖼️  Step 5: Filling missing logos (Clearbit → UI Avatar)..."
php fill_missing_logos.php

# Step 6: Final stats
echo ""
echo "📊 Step 6: Final data completeness report..."
php get_data_stats.php

echo ""
echo "================================================"
echo " Pipeline complete!"
echo "================================================"
