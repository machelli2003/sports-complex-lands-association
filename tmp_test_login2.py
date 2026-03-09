import http.client, json
conn = http.client.HTTPConnection('localhost',5001,timeout=10)
payload = json.dumps({'username':'admin','password':'admin123'})
headers = {'Content-Type':'application/json'}
try:
    conn.request('POST','/api/login',payload,headers)
    res = conn.getresponse()
    print(res.status)
    for k,v in res.getheaders():
        print(f"{k}: {v}")
    print(res.read().decode())
except Exception as e:
    print('ERR', e)
finally:
    conn.close()
