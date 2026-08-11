import pandas as pd
import json

file_path = "/Users/sinan/Downloads/Irshad_Fin_Screen_updated.xlsx"
output_path = "/Users/sinan/Herd/irshad/backend/updated_financials_raw.json"

xl = pd.ExcelFile(file_path)
data = {}

def clean_val(val):
    if pd.isna(val) or val is None:
        return 0
    try:
        return float(val)
    except:
        return 0

for sheet in xl.sheet_names:
    if sheet == "Financial Summary":
        continue
    
    ticker = sheet.strip()
    df = pd.read_excel(xl, sheet_name=sheet)
    
    col0 = df.iloc[:, 0].tolist()
    
    market_cap = 0
    borrowings_nc = 0
    borrowings_c = 0
    commercial_papers = 0
    cash = 0
    other_assets = 0
    revenue = 0
    finance_income = 0
    
    # Only scan up to row 16 to avoid the ratio breakdown section
    for i, val in enumerate(col0[:17]):
        if not isinstance(val, str):
            continue
            
        val = val.strip()
        # Match keys exactly
        if val == "Market Capitalisation (₦)":
            market_cap = clean_val(df.iloc[i, 1])
        elif val == "Borrowings — Non-current":
            borrowings_nc = clean_val(df.iloc[i, 1])
        elif val == "Borrowings — Current":
            borrowings_c = clean_val(df.iloc[i, 1])
        elif val == "Commercial Papers / Notes Payable" or val == "Commercial Papers":
            commercial_papers = clean_val(df.iloc[i, 1])
        elif val == "Cash and Cash Equivalents":
            cash = clean_val(df.iloc[i, 1])
        elif val == "Other Financial Assets / Securities":
            other_assets = clean_val(df.iloc[i, 1])
        elif val == "Revenue":
            revenue = clean_val(df.iloc[i, 1])
        elif val == "Finance Income":
            finance_income = clean_val(df.iloc[i, 1])
            
    # Source data (except market cap) is in N'000
    multiplier = 1000
    
    total_debt = (borrowings_nc + borrowings_c + commercial_papers) * multiplier
    total_cash = (cash + other_assets) * multiplier
    total_revenue = revenue * multiplier
    total_finance_income = finance_income * multiplier
    
    data[ticker] = {
        "market_cap": market_cap,
        "total_debt": total_debt,
        "cash_and_equivalents": total_cash,
        "interest_bearing_securities": 0,
        "total_revenue": total_revenue,
        "interest_income": total_finance_income
    }
    
with open(output_path, "w") as f:
    json.dump(data, f, indent=2)

print(f"Extracted {len(data)} companies successfully.")
