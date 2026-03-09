
import urllib.request
import urllib.error
import json

BASE = 'http://localhost:5001/api'

def test_reports_direct():
    print("Testing reports routes directly...")
    
    routes = [
        '/reports/daily-revenue',
        '/reports/payment-types',
        '/reports/outstanding-payments',
        '/reports/completion-analytics',
        '/reports/total-transactions'
    ]
    
    for route in routes:
        print(f"Checking {route}...")
        req = urllib.request.Request(f'{BASE}{route}')
        try:
            with urllib.request.urlopen(req) as r:
                body = r.read().decode()
                print(f"  OK: {r.status}")
                # print(f"  Body: {body[:100]}...")
        except urllib.error.HTTPError as e:
            print(f"  FAILED: {e.code}")
            print(f"  Error body: {e.read().decode()}")
        except Exception as e:
            print(f"  ERROR: {e}")

if __name__ == '__main__':
    test_reports_direct()
