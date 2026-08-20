import json
import csv
import os

db_file = '/Users/sinan/Herd/irshad/backend/db_dump_fast.json'
csv_file = '/Users/sinan/Desktop/stocks_financial_data.csv'

with open(db_file, 'r') as f:
    db_data_raw = json.load(f)

db_data = {}
for item in db_data_raw:
    symbol = item.get('symbol')
    if not symbol: continue
    
    financials = item.get('financials', [])
    fin = financials[0] if financials else {}
    
    aaoifi = item.get('aaoifi_screening', {}) or {}
    
    db_data[symbol] = {
        'Market Cap': float(item.get('market_cap') or 0),
        'Total Assets': float(fin.get('total_assets') or 0),
        'Total Debt': float(fin.get('total_debt') or 0),
        'Cash': float(fin.get('cash_and_equivalents') or 0),
        'Interest Income': float(fin.get('interest_income') or 0),
        'Total Revenue': float(fin.get('total_revenue') or 0),
        'Debt Ratio': float(aaoifi.get('debt_ratio') or 0),
        'Cash Ratio': float(aaoifi.get('cash_ratio') or 0),
        'Impure Ratio': float(aaoifi.get('impermissible_income_ratio') or 0),
        'Final Status': aaoifi.get('final_status') or item.get('current_status')
    }

discrepancies = {}
missing = []

with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        symbol = row.get('Symbol')
        if not symbol: continue
        
        if symbol not in db_data:
            missing.append(symbol)
            continue
            
        db = db_data[symbol]
        diffs = {}
        
        for key in ['Total Assets', 'Total Debt', 'Cash', 'Interest Income', 'Total Revenue']:
            csv_val = float(row[key].replace(',', '')) if row[key] else 0
            if abs(csv_val - db[key]) > 100:
                diffs[key] = f"CSV: {csv_val} | DB: {db[key]}"
                
        for key in ['Debt Ratio', 'Cash Ratio', 'Impure Ratio']:
            csv_val = float(row[key].replace(',', '')) if row[key] else 0
            # CSV val is decimal (e.g. 0.3399), DB val is percentage (e.g. 33.99)
            if abs((csv_val * 100) - db[key]) > 0.01:
                diffs[key] = f"CSV: {csv_val} | DB: {db[key]}"
                
        if row['Final Status'].lower() != db['Final Status'].lower():
            diffs['Final Status'] = f"CSV: {row['Final Status']} | DB: {db['Final Status']}"
            
        if diffs:
            discrepancies[symbol] = diffs

with open('/Users/sinan/Herd/irshad/backend/python_comparison_results.json', 'w') as f:
    json.dump({'missing': missing, 'discrepancies': discrepancies}, f, indent=2)

print("Comparison complete!")
