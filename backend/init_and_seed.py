import os
from datetime import datetime
from main import create_app
from app.models import LocalAssociation, Stage, PaymentType, User
from werkzeug.security import generate_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INSTANCE_DIR = os.path.join(BASE_DIR, 'instance')
os.makedirs(INSTANCE_DIR, exist_ok=True)


def seed():
    associations = [
        {'name': 'Accra Central Association', 'location': 'Accra', 'contact_person': 'John Doe', 'phone': '+233123456789'},
        {'name': 'Tema Association', 'location': 'Tema', 'contact_person': 'Jane Smith', 'phone': '+233987654321'},
        {'name': 'Kumasi Association', 'location': 'Kumasi', 'contact_person': 'Bob Johnson', 'phone': '+233555666777'}
    ]

    for assoc in associations:
        existing = LocalAssociation.objects(association_name=assoc['name']).first()
        if not existing:
            LocalAssociation(
                association_name=assoc['name'],
                location=assoc['location'],
                contact_person=assoc['contact_person'],
                phone=assoc['phone']
            ).save()

    stages = [
        (1, 'Registration', [('Registration Fee', 1500)]),
        (2, 'Chief Stage', [('Site Plan', 3000), ('Ground Rent', 8500), ('Indenture', 15000)]),
        (3, 'PVLMD', [('PVLMD Fee', 15000)]),
        (4, 'Stamping', [('Stamping Fee', 3500)]),
        (5, 'Collection', [('Leasehold Collection Fee', 15000)]),
    ]

    for number, name, payments in stages:
        stage = Stage.objects(stage_number=number).first()
        if not stage:
            stage = Stage(stage_number=number, stage_name=name, description=f"{name} stage")
            stage.save()

        for p_name, amount in payments:
            existing_pt = PaymentType.objects(stage=stage.id, payment_name=p_name).first()
            if not existing_pt:
                PaymentType(stage=stage, payment_name=p_name, default_amount=amount, description=f"Payment for {p_name}").save()

    # Admin user
    admin_username = 'admin'
    admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
    existing_admin = User.objects(username=admin_username).first()
    if existing_admin:
        existing_admin.password_hash = generate_password_hash(admin_password, method='pbkdf2:sha256')
        existing_admin.save()
        print('Updated existing admin password')
    else:
        User(username=admin_username, full_name='System Administrator', role='admin', password_hash=generate_password_hash(admin_password, method='pbkdf2:sha256')).save()
        print('Inserted admin user')


def main():
    app = create_app()
    with app.app_context():
        seed()
        print('Seeding complete')


if __name__ == '__main__':
    main()
