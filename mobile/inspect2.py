from PIL import Image

img = Image.open("/Users/sinan/Herd/irshad/mobile/assets/images/app_icon.png")
w, h = img.size

# Check top half
top = img.crop((0, 0, w, h//2))
print("Top half bbox:", top.getbbox())

# Check bottom half
bottom = img.crop((0, h//2, w, h))
print("Bottom half bbox:", bottom.getbbox())

