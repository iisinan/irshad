from PIL import Image

try:
    # Open the existing app_icon
    img = Image.open("/Users/sinan/Herd/irshad/mobile/assets/images/app_icon.png")
    w, h = img.size
    print(f"Original Size: {w}x{h}")
    
    # We want a square. If width > height, we assume it's a horizontal logo
    if w > h:
        # Get bounding box of non-transparent pixels to make sure we crop correctly
        bbox = img.getbbox()
        if bbox:
            print(f"Bounding box: {bbox}")
            # Crop to the bounding box first
            img_cropped = img.crop(bbox)
            cw, ch = img_cropped.size
            
            # Now crop a square from the left of the new image
            # The icon itself should be ch x ch
            square_crop = img_cropped.crop((0, 0, ch, ch))
            
            # Save the cropped square
            square_crop.save("/Users/sinan/Herd/irshad/mobile/assets/images/app_icon.png")
            print(f"Cropped to {ch}x{ch} and overwrote app_icon.png")
        else:
            print("Image is empty/transparent.")
    else:
        print("Image is already square or vertical.")

except Exception as e:
    print(f"Error: {e}")
