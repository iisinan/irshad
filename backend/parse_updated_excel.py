import pandas as pd
import json

file_path = "/Users/sinan/Downloads/Irshad_Fin_Screen_updated.xlsx"

try:
    df = pd.read_excel(file_path, sheet_name=0, skiprows=1)
    
    # Handle NaN values for JSON serialization
    def replace_nan(obj):
        if isinstance(obj, dict):
            return {k: replace_nan(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [replace_nan(i) for i in obj]
        elif isinstance(obj, float) and pd.isna(obj):
            return None
        return obj

    records = df.to_dict(orient="records")
    print(json.dumps(replace_nan(records), indent=2))
except Exception as e:
    print(f"Error reading first sheet: {e}")
