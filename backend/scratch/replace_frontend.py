import os
import re

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replacements
    new_content = content
    # exact string replacements in code and CSS variables
    new_content = new_content.replace('non-halal', 'non-compliant')
    new_content = new_content.replace('non_halal', 'non_compliant')
    new_content = new_content.replace('Non-Halal', 'Non-Compliant')
    new_content = new_content.replace('NON-HALAL', 'NON-COMPLIANT')
    
    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {filepath}")

def main():
    target_dir = '/Users/sinan/Herd/irshad/web/src'
    
    for root, dirs, files in os.walk(target_dir):
        for file in files:
            if file.endswith(('.js', '.jsx', '.ts', '.tsx', '.css', '.html')):
                filepath = os.path.join(root, file)
                replace_in_file(filepath)

if __name__ == '__main__':
    main()
