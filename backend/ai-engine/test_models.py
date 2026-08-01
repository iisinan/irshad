import os
from google import genai

api_key = os.getenv("GEMINI_API_KEY")
from google.genai import types as genai_types
client = genai.Client(api_key=api_key, http_options=genai_types.HttpOptions(api_version='v1'))

print("Available models:")
for model in client.models.list():
    if "flash" in model.name:
        print(model.name)
