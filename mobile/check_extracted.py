from PIL import Image

img = Image.open("/Users/sinan/Herd/irshad/mobile/assets/images/extracted_logo.png").convert("RGBA")
print("Size:", img.size)

# Make white pixels transparent
datas = img.getdata()
newData = []
for item in datas:
    if item[0] > 240 and item[1] > 240 and item[2] > 240:
        newData.append((255, 255, 255, 0))
    else:
        newData.append(item)

img.putdata(newData)
print("Bbox after transparency:", img.getbbox())

