import requests
import time
import json

BASE = "http://localhost:5001/api"

ts = time.strftime('%Y%m%d%H%M%S')
username = f"test_user_name_{ts}"
password = "TestPass123!"

print("Registering user:", username)
resp = requests.post(f"{BASE}/register", json={"username": username, "full_name": "Test User", "password": password})
print('REGISTER status:', resp.status_code)
try:
    print(resp.json())
except Exception:
    print(resp.text)

print('\nLogging in')
resp = requests.post(f"{BASE}/login", json={"username": username, "password": password})
print('LOGIN status:', resp.status_code)
print(resp.text)
if resp.status_code != 200:
    print('Login failed, aborting')
    raise SystemExit(1)

token = resp.json().get('access_token')
headers = {'Authorization': f'Bearer {token}'}

print('\nCreating client')
client_payload = {"file_number": f"FN_{ts}", "full_name": f"Client {ts}", "phone": "0244000000"}
resp = requests.post(f"{BASE}/clients", json=client_payload, headers=headers)
print('CREATE CLIENT status:', resp.status_code)
print(resp.text)
if resp.status_code != 201:
    print('Client creation failed, aborting')
    raise SystemExit(1)
client_id = resp.json().get('client_id')
client_name = client_payload['full_name']

print('\nFetching stages')
resp = requests.get(f"{BASE}/stages", headers=headers)
print('STAGES status:', resp.status_code)
print(resp.text)
stages = resp.json()
if not stages:
    print('No stages available, aborting')
    raise SystemExit(1)
stage_id = stages[0]['stage_id']

print('\nFetching payment types for stage', stage_id)
resp = requests.get(f"{BASE}/stages/{stage_id}/payment-types", headers=headers)
print('PAYMENT TYPES status:', resp.status_code)
print(resp.text)
pt = resp.json()
if not pt.get('payment_types'):
    print('No payment types available, aborting')
    raise SystemExit(1)
payment_type = pt['payment_types'][0]['payment_type']

print('\nPosting payment using client name as identifier')
payment_payload = {
    'client_identifier': client_name,
    'stage_id': stage_id,
    'payment_type': payment_type,
    'amount': 5,
    'receipt_number': f'RCPT_NAME_TEST_{ts}',
    'payment_method': 'cash'
}
resp = requests.post(f"{BASE}/payments", json=payment_payload, headers=headers)
print('POST PAYMENT status:', resp.status_code)
try:
    print(json.dumps(resp.json(), indent=2))
except Exception:
    print(resp.text)

print('\nTest complete')
