from PIL import Image

img = Image.open("/Users/sinan/Herd/irshad/mobile/assets/images/logo.png").convert("RGBA")
print("Size:", img.size)

# Let's see the colors of the first few pixels
print("Top-left pixel:", img.getpixel((0,0)))

# Make white pixels transparent
datas = img.getdata()
newData = []
for item in datas:
    # If the pixel is white (or very close to white)
    if item[0] > 240 and item[1] > 240 and item[2] > 240:
        newData.append((255, 255, 255, 0)) # transparent
    else:
        newData.append(item)

img.putdata(newData)

w, h = img.size
# Crop top half
top = img.crop((0, 0, w, h//2))
print("Top half bbox:", top.getbbox())

