from PIL import Image

img = Image.open("/Users/sinan/Herd/irshad/mobile/assets/images/extracted_logo.png").convert("RGBA")

# Make white pixels transparent
datas = img.getdata()
newData = []
for item in datas:
    # Treat very light pixels as white to handle anti-aliasing artifacts
    if item[0] > 240 and item[1] > 240 and item[2] > 240:
        newData.append((255, 255, 255, 0))
    else:
        newData.append(item)

img.putdata(newData)

# Check top half bounding box
w, h = img.size
top = img.crop((0, 0, w, h//2))
print("Top half bbox:", top.getbbox())

if top.getbbox():
    # Crop around the top half
    cx = (top.getbbox()[0] + top.getbbox()[2]) // 2
    cy = (top.getbbox()[1] + top.getbbox()[3]) // 2
    box = (cx - 300, cy - 300, cx + 300, cy + 300)
    final_img = img.crop(box)
    final_img.save("/Users/sinan/Herd/irshad/mobile/assets/images/app_icon.png")
    print("Successfully saved cropped transparent logo to app_icon.png")

