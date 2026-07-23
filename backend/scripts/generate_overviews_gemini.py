#!/usr/bin/env python3
"""
Gemini AI fallback for company overviews.
For companies where Yahoo Finance returned no overview, generate one using Gemini.
Input: JSON file with {symbol: {name, sector}} for companies needing overviews
Output: {symbol: overview_text}
"""
import json
import sys
import os
import time
import google.generativeai as genai

def generate_overview(symbol: str, name: str, sector: str) -> str:
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = (
            f"Write a concise 2-3 sentence business overview for {name} ({symbol}), "
            f"a publicly listed company on the Nigerian Exchange (NGX) in the {sector} sector. "
            f"Focus on what the company does, its market position in Nigeria, and key products/services. "
            f"Be factual and professional. Do not mention stock price or financials."
        )
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"{name} is a publicly listed company on the Nigerian Exchange (NGX), operating in the {sector} sector."

def main():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print(json.dumps({"error": "No GEMINI_API_KEY set"}))
        sys.exit(1)
    
    genai.configure(api_key=api_key)

    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input file provided"}))
        sys.exit(1)

    with open(sys.argv[1]) as f:
        companies = json.load(f)  # {symbol: {name, sector}}

    results = {}
    total = len(companies)
    for i, (symbol, info) in enumerate(companies.items()):
        print(f"[{i+1}/{total}] Generating overview for {symbol}...", file=sys.stderr)
        results[symbol] = generate_overview(symbol, info["name"], info.get("sector", "General"))
        time.sleep(0.5)  # Rate limit

    print(json.dumps(results))

if __name__ == "__main__":
    main()
