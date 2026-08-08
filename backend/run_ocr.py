import fitz
import subprocess
import os

doc = fitz.open("trippleg.pdf")
for i in range(1, 4): # Pages 2, 3, 4
    page = doc[i]
    pix = page.get_pixmap(dpi=150)
    img_path = f"page_{i}.png"
    pix.save(img_path)
    # OCR
    print(f"=== PAGE {i} ===")
    result = subprocess.run(["./ocr", img_path], capture_output=True, text=True)
    print(result.stdout)
    os.remove(img_path)
