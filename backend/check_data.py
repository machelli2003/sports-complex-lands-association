from main import create_app
from app.models import Stage, PaymentType

app = create_app()
with app.app_context():
    stages = Stage.objects()
    print('Stages:')
    for s in stages:
        print(f'ID: {s.id}, Number: {s.stage_number}, Name: {s.stage_name}')

    payment_types = PaymentType.objects()
    print('\nPayment Types:')
    for pt in payment_types:
        print(f'Stage ID: {pt.stage.id if pt.stage else None}, Name: {pt.payment_name}, Amount: {pt.default_amount}')
