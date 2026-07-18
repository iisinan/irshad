import base64
import re
from PIL import Image
from io import BytesIO

with open('web/public/logo.svg', 'r') as f: # wait, logo.svg is my broken one. I'll use the original git commit content
    pass
with open('web/public/logo_test.svg', 'r') as f:
    svg_data = f.read()

match = re.search(r'data:image/png;base64,([A-Za-z0-9+/=]+)', svg_data)
b64_string = match.group(1)
img_data = base64.b64decode(b64_string)

img = Image.open(BytesIO(img_data)).convert('RGBA')
print("Image size:", img.size)
colors = img.getcolors(maxcolors=100)
if colors:
    print("Unique colors:", len(colors))
    for count, color in sorted(colors, reverse=True)[:5]:
        print(f"Count: {count}, Color: {color}")
else:
    print("Too many colors")
