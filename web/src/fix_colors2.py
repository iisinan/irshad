import os

dir_path = '/Users/sinan/Herd/irshad/web/src'

replacements = {
    'rgba(243,198,81,': 'rgba(201, 149, 42, ',
    "color: '#0B0F17'": "color: 'white'",
    'color: "#0B0F17"': 'color: "white"',
    "color:'#0B0F17'": "color:'white'",
    'color:"#0B0F17"': 'color:"white"',
}

for root, dirs, files in os.walk(dir_path):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.css'):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for old, new in replacements.items():
                new_content = new_content.replace(old, new)
            
            if new_content != content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {file_path}")
