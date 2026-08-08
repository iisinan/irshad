import os
from openai import OpenAI
import json
import sys

client = OpenAI(
    api_key=os.environ.get("PERPLEXITY_API_KEY"),
    base_url="https://api.perplexity.ai"
)

url = sys.argv[1]

prompt = f"""
I need you to extract specific financial data from the following financial statement PDF for Morison Industries Plc:
{url}

Please extract the following values:
1. Total Assets
2. Total Debt (Interest-bearing loans, borrowings, overdrafts, lease liabilities)
3. Total Cash and Cash Equivalents (and interest-bearing securities)
4. Total Revenue
5. Total Impermissible/Non-Halal Income
6. Total Interest Income

Return the output strictly as a JSON object with these exact keys, using numerical values (without commas or symbols, multiplied by the appropriate scale if stated in thousands/millions). If a value is 0 or not found, return 0.
Keys: "total_assets", "total_debt", "cash_and_equivalents", "total_revenue", "impermissible_income", "interest_income".
"""

try:
    response = client.chat.completions.create(
        model="sonar",
        messages=[
            {"role": "system", "content": "You are a financial analyst. Return only JSON without any markdown formatting."},
            {"role": "user", "content": prompt}
        ]
    )
    print(response.choices[0].message.content)
except Exception as e:
    print(f"Error: {e}")
