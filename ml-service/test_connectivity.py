import requests
import json

url = "http://localhost:5000/predict"
data = {
    "glucose": 140,
    "bloodPressure": 80,
    "skinThickness": 20,
    "insulin": 80,
    "bmi": 26.5,
    "diabetesPedigreeFunction": 0.5,
    "age": 45,
    "genetics": "Yes"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
