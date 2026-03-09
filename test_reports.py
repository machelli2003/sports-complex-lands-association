
import urllib.request
import urllib.error
import json

BASE = 'http://localhost:5001/api'

def test_reports():
    print("Testing reports routes...")
    
    # Login to get token
    req = urllib.request.Request(f'{BASE}/login', method='POST', headers={'Content-Type': 'application/json'}, data=json.dumps({'username': 'admin', 'password': 'admin123'}).encode())
    try:
        with urllib.request.urlopen(req) as r:
            body = json.loads(r.read().decode())
            token = body['access_token']
            print("Login successful")
    except Exception as e:
        print(f"Login failed: {e}")
        return

    headers = {'Authorization': f'Bearer {token}'}
    
    routes = [
        '/reports/daily-revenue',
        '/reports/payment-types',
        '/reports/outstanding-payments',
        '/reports/completion-analytics',
        '/reports/total-transactions'
    ]
    
    for route in routes:
        print(f"Checking {route}...")
        req = urllib.request.Request(f'{BASE}{route}', headers=headers)
        try:
            with urllib.request.urlopen(req) as r:
                print(f"  OK: {r.status}")
        except urllib.error.HTTPError as e:
            print(f"  FAILED: {e.code}")
            print(f"  Error body: {e.read().decode()}")
        except Exception as e:
            print(f"  ERROR: {e}")

if __name__ == '__main__':
    test_reports()
