import requests
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')
api_key = os.environ.get("GEMINI_API_KEY")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
try:
    response = requests.get(url)
    response.raise_for_status()
    print([m['name'] for m in response.json()['models']])
except Exception as e:
    print(e)
