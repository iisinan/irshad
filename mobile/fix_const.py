import re
import os

def fix_invalid_const(log_path):
    with open(log_path, 'r') as f:
        log_content = f.read()
    
    # Extract file paths and line numbers for "Invalid constant value" and "Undefined name 'context'"
    # and "The instance member 'context' can't be accessed in an initializer"
    pattern = r'(?:Invalid constant value|Undefined name \'context\'|The instance member \'context\' can\'t be accessed in an initializer|Const variables must be initialized) • (lib/[^\s:]+):(\d+):(\d+)'
    matches = re.findall(pattern, log_content)
    
    # Group by file
    files_to_fix = {}
    for file, line, col in matches:
        if file not in files_to_fix:
            files_to_fix[file] = []
        files_to_fix[file].append((int(line), int(col)))
        
    for file, errors in files_to_fix.items():
        if not os.path.exists(file):
            continue
        with open(file, 'r') as f:
            lines = f.readlines()
            
        # Sort errors by line descending to not mess up line numbers if we were inserting (we are only replacing)
        for line_num, col in errors:
            idx = line_num - 1
            if idx < 0 or idx >= len(lines):
                continue
                
            # Look at the current line and the 5 preceding lines for a 'const' keyword
            # Since the error could be on a child widget, but the const is on the parent
            for i in range(idx, max(-1, idx - 8), -1):
                if 'const ' in lines[i]:
                    lines[i] = re.sub(r'\bconst\s+', '', lines[i], count=1)
                    # We only remove one const per error, hopefully the closest parent.
                    break
                    
        with open(file, 'w') as f:
            f.writelines(lines)
            
    print(f"Fixed {len(files_to_fix)} files.")

if __name__ == "__main__":
    fix_invalid_const("analyzer_output.txt")
