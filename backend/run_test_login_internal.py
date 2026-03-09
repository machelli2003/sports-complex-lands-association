from main import create_app

app = create_app()
with app.test_client() as client:
    resp = client.post('/api/login', json={'username': 'admin', 'password': 'admin123'})
    print(resp.status_code)
    try:
        print(resp.get_json())
    except Exception:
        print(resp.data.decode())
