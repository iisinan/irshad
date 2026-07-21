from PIL import Image

img = Image.open("/Users/sinan/Herd/irshad/mobile/assets/images/app_icon.png")

# Center of the logo icon is around X=643, Y=405
# Let's crop a 600x600 square around it
box = (343, 105, 943, 705)
cropped = img.crop(box)

cropped.save("/Users/sinan/Herd/irshad/mobile/assets/images/app_icon.png")
print("Successfully cropped app_icon.png to remove text.")
