import pandas as pd
df = pd.read_excel('/Users/sinan/Downloads/Irshad Stock Screening data_bzctv.xlsx', header=3)
doubtful = df[df['Business Activity Screen'].astype(str).str.lower().str.contains('doubtful', na=False)]
for _, row in doubtful.iterrows():
    print(f"[{row['Ticker']}] {row['Rationale']}")
