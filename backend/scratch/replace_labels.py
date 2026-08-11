import os
import re

dir_to_search = '/Users/sinan/Herd/irshad/web/src'

for root, _, files in os.walk(dir_to_search):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()

            new_content = content
            
            # Replace labels
            new_content = re.sub(r"label:\s*'HALAL'", "label: 'SHARIAH COMPLIANT'", new_content)
            new_content = re.sub(r"label:\s*'NON-HALAL'", "label: 'SHARIAH NON-COMPLIANT'", new_content)
            
            new_content = re.sub(r'label:\s*"HALAL"', 'label: "SHARIAH COMPLIANT"', new_content)
            new_content = re.sub(r'label:\s*"NON-HALAL"', 'label: "SHARIAH NON-COMPLIANT"', new_content)
            
            new_content = re.sub(r"label:\s*'Halal'", "label: 'Shariah Compliant'", new_content)
            new_content = re.sub(r"label:\s*'Non-Halal'", "label: 'Shariah Non-Compliant'", new_content)
            
            new_content = re.sub(r'label:\s*"Halal"', 'label: "Shariah Compliant"', new_content)
            new_content = re.sub(r'label:\s*"Non-Halal"', 'label: "Shariah Non-Compliant"', new_content)

            # Fix specific AaoifiScreening tags to avoid duplication
            if 'AaoifiScreening.jsx' in file:
                new_content = new_content.replace("tag:'Shariah Compliant'", "tag:''")
                new_content = new_content.replace("tag:'Shariah Non-Compliant'", "tag:''")
            
            # Fix AdminComplianceReviews raw strings if any
            new_content = new_content.replace("'→ Halal only'", "'→ Shariah Compliant only'")
            new_content = new_content.replace("'→ Non-Halal only'", "'→ Shariah Non-Compliant only'")
            new_content = new_content.replace('label="→ Halal"', 'label="→ Shariah Compliant"')
            new_content = new_content.replace('label="→ Non-Halal"', 'label="→ Shariah Non-Compliant"')
            new_content = new_content.replace(">Halal<", ">Shariah Compliant<")
            new_content = new_content.replace(">Non-Halal<", ">Shariah Non-Compliant<")
            
            if new_content != content:
                print(f"Updated {file}")
                with open(filepath, 'w') as f:
                    f.write(new_content)

print("Done replacing labels.")
