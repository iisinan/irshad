import base64
import re
from PIL import Image
from io import BytesIO

with open('web/public/logo_test.svg', 'r') as f:
    svg_data = f.read()

match = re.search(r'data:image/png;base64,([A-Za-z0-9+/=]+)', svg_data)
b64_string = match.group(1)
img_data = base64.b64decode(b64_string)

img = Image.open(BytesIO(img_data)).convert('RGBA')
data = list(img.getdata())
print("Total pixels:", len(data))

# Find the most common colors
from collections import Counter
counts = Counter(data)
print("Top 10 most common colors:")
for color, count in counts.most_common(10):
    print(f"{count} pixels: {color}")
