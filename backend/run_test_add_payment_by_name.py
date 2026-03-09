from main import create_app
from datetime import datetime

app = create_app()
with app.test_client() as client:
    # login
    r = client.post('/api/login', json={'username':'admin','password':'admin123'})
    print('Login status:', r.status_code)
    token = r.get_json().get('access_token') if r.status_code == 200 else None
    headers = {'Authorization': f'Bearer {token}'} if token else {}

    # get clients
    rc = client.get('/api/clients', headers=headers)
    print('Clients status:', rc.status_code)
    clients = rc.get_json() if rc.status_code == 200 else []
    if not clients:
        print('No clients found to test')
    else:
        client0 = clients[0]
        client_identifier = client0.get('full_name')
        print('Using client:', client_identifier)

        # find stage id from stage_number
        rs = client.get('/api/stages', headers=headers)
        stages = rs.get_json() if rs.status_code == 200 else []
        stage_id = None
        for s in stages:
            if s.get('stage_number') == client0.get('current_stage'):
                stage_id = s.get('stage_id')
                break
        if not stage_id and stages:
            stage_id = stages[0].get('stage_id')
        print('Stage id:', stage_id)

        # get payment types for stage
        rpt = client.get(f'/api/stages/{stage_id}/payment-types', headers=headers)
        print('Payment types status:', rpt.status_code)
        pt_data = rpt.get_json() if rpt.status_code == 200 else {}
        payment_types = pt_data.get('payment_types') or []
        if not payment_types:
            print('No payment types for stage')
        else:
            pt = payment_types[0]
            payment_type = pt.get('payment_type')
            amount = pt.get('required_amount') or 1
            receipt = f"TEST-{int(datetime.utcnow().timestamp())}"

            payload = {
                'client_identifier': client_identifier,
                'stage_id': stage_id,
                'payment_type': payment_type,
                'amount': amount,
                'receipt_number': receipt
            }

            rp = client.post('/api/payments', json=payload, headers=headers)
            print('Add payment status:', rp.status_code)
            try:
                print(rp.get_json())
            except Exception:
                print(rp.data.decode())
