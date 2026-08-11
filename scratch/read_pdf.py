import sys
import pypdf

reader = pypdf.PdfReader(sys.argv[1])
text = "\n".join(page.extract_text() for page in reader.pages)
print(text)
