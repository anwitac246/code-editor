import requests
import json

def test_bugdetect():
    url = "http://localhost:5000/api/bugdetect"
    payload = {
        "code": "def add(a, b):\nprint(a + b)", 
        "language": "python"
    }
    response = requests.post(url, json=payload)
    try:
        data = response.json()
        print("Bug Detect JSON:")
        print(json.dumps(data, indent=2))
    except Exception as e:
        print("Error parsing JSON:", e)
        print(response.text)

def test_bugfix():
    url = "http://localhost:5000/api/bugfix"
    payload = {
        "code": "def add(a, b):\nprint(a + b)", 
        "language": "python"
    }
    response = requests.post(url, json=payload)
    try:
        data = response.json()
        print("Bug Fix JSON:")
        print(json.dumps(data, indent=2))
    except Exception as e:
        print("Error parsing JSON:", e)
        print(response.text)

if __name__ == '__main__':
    print("Testing /api/bugdetect endpoint:")
    test_bugdetect()
    print("\nTesting /api/bugfix endpoint:")
    test_bugfix()
