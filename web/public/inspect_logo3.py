import base64
import re
from PIL import Image
from io import BytesIO

with open('web/public/logo_test_8842320.svg', 'r') as f:
    svg_data = f.read()

matches = re.findall(r'data:image/png;base64,([A-Za-z0-9+/=]+)', svg_data)
print(f"Found {len(matches)} embedded images.")

for i, b64_string in enumerate(matches):
    img_data = base64.b64decode(b64_string)
    img = Image.open(BytesIO(img_data)).convert('RGBA')
    print(f"Image {i+1} size: {img.size}")
    data = list(img.getdata())
    from collections import Counter
    counts = Counter(data)
    print(f"Top 5 most common colors for image {i+1}:")
    for color, count in counts.most_common(5):
        print(f"{count} pixels: {color}")
