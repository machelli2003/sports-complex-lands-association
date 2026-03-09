import requests
try:
    r = requests.post('http://localhost:5001/api/login', json={'username':'admin','password':'wrong'}, timeout=10)
    print(r.status_code)
    print(r.headers)
    print(r.text)
except Exception as e:
    print('ERR', e)
