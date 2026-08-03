import re

def parse_title(title):
    title_lower = title.lower()
    
    # Extract Year (e.g. 2023, 2024, 2025, 2026)
    year_match = re.search(r'\b(20\d{2})\b', title)
    year = int(year_match.group(1)) if year_match else None
    
    # Extract Period
    period = "Annual"
    if re.search(r'\b(q1|first quarter)\b', title_lower):
        period = "Q1"
    elif re.search(r'\b(q2|second quarter|half year|h1)\b', title_lower):
        period = "Q2"
    elif re.search(r'\b(q3|third quarter|9 months|nine months)\b', title_lower):
        period = "Q3"
    elif re.search(r'\b(q4|fourth quarter|full year|audited)\b', title_lower):
        period = "Annual"

    # Extract Revision Keywords
    revision_keywords = ['amended', 'revised', 'corrected', 'restated', 'updated']
    is_revised = any(kw in title_lower for kw in revision_keywords)
    
    return year, period, is_revised

titles = [
    "UNAUDITED FINANCIAL STATEMENTS FOR THE FIRST QUARTER ENDED MARCH 31 2024",
    "Q2 2024 Unaudited Financial Statement",
    "Audited Financial Statements for the year ended 31 December 2023",
    "Restated Q3 2023 Financial Statements",
    "Amended Half Year 2024 Financial Report",
    "Nine Months 2023 Financials"
]

for t in titles:
    print(f"'{t}' -> {parse_title(t)}")
