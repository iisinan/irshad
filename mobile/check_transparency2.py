from PIL import Image

img = Image.open("/Users/sinan/Herd/irshad/mobile/assets/images/logo.png")
print("Mode:", img.mode)
print("Has alpha channel:", img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info))

if img.mode == 'RGBA':
    extrema = img.getextrema()
    print("Alpha extrema:", extrema[3])
