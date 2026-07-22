import os
import glob
import re

dir_path = "lib/features/stocks/ui"

for filepath in glob.glob(os.path.join(dir_path, "*.dart")):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replace ((s['latest_price'] ?? 0) as num) with (double.tryParse(s['latest_price']?.toString() ?? '0') ?? 0.0)
    new_content = re.sub(
        r"\(\(s\['latest_price'\] \?\? 0\) as num\)",
        r"(double.tryParse(s['latest_price']?.toString() ?? '0') ?? 0.0)",
        content
    )
    # Replace ((stock['latest_price'] ?? 0) as num) with (double.tryParse(stock['latest_price']?.toString() ?? '0') ?? 0.0)
    new_content = re.sub(
        r"\(\(stock\['latest_price'\] \?\? 0\) as num\)",
        r"(double.tryParse(stock['latest_price']?.toString() ?? '0') ?? 0.0)",
        new_content
    )
    # Replace ((a['latest_price'] ?? 0) as num)
    new_content = re.sub(
        r"\(\(a\['latest_price'\] \?\? 0\) as num\)",
        r"(double.tryParse(a['latest_price']?.toString() ?? '0') ?? 0.0)",
        new_content
    )
    # Replace ((b['latest_price'] ?? 0) as num)
    new_content = re.sub(
        r"\(\(b\['latest_price'\] \?\? 0\) as num\)",
        r"(double.tryParse(b['latest_price']?.toString() ?? '0') ?? 0.0)",
        new_content
    )
    
    # Also check if there are any other `as num` left
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
