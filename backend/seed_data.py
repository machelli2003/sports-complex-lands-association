import os
from dotenv import load_dotenv
from main import create_app
from app.models import Stage, PaymentType, LocalAssociation

load_dotenv()

app = create_app()

associations_data = [
    {'name': 'Accra Central Association', 'location': 'Accra', 'contact_person': 'John Doe', 'phone': '+233123456789'},
    {'name': 'Tema Association', 'location': 'Tema', 'contact_person': 'Jane Smith', 'phone': '+233987654321'},
    {'name': 'Kumasi Association', 'location': 'Kumasi', 'contact_person': 'Bob Johnson', 'phone': '+233555666777'},
]

stages_data = [
    {
        'number': 1,
        'name': 'Registration',
        'payments': [{'name': 'Registration Fee', 'amount': 1500}]
    },
    {
        'number': 2,
        'name': 'Chief Stage',
        'payments': [
            {'name': 'Site Plan', 'amount': 3000},
            {'name': 'Ground Rent', 'amount': 8500},
            {'name': 'Indenture', 'amount': 15000}
        ]
    },
    {
        'number': 3,
        'name': 'PVLMD',
        'payments': [{'name': 'PVLMD Fee', 'amount': 15000}]
    },
    {
        'number': 4,
        'name': 'Stamping',
        'payments': [{'name': 'Stamping Fee', 'amount': 3500}]
    },
    {
        'number': 5,
        'name': 'Collection',
        'payments': [{'name': 'Leasehold Collection Fee', 'amount': 15000}]
    },
]

with app.app_context():
    print("Cleaning existing data...")
    # Delete in reverse dependency order
    PaymentType.objects.delete()
    Stage.objects.delete()
    LocalAssociation.objects.delete()

    print("Seeding associations...")
    for assoc in associations_data:
        existing = LocalAssociation.objects(association_name=assoc['name']).first()
        if not existing:
            LocalAssociation(
                association_name=assoc['name'],
                location=assoc['location'],
                contact_person=assoc['contact_person'],
                phone=assoc['phone']
            ).save()

    print("Seeding stages and payment types...")
    for data in stages_data:
        stage = Stage.objects(stage_number=data['number']).first()
        if not stage:
            stage = Stage(stage_number=data['number'], stage_name=data['name'], description=f"{data['name']} stage")
            stage.save()

        for payment in data['payments']:
            existing_pt = PaymentType.objects(stage=stage.id, payment_name=payment['name']).first()
            if not existing_pt:
                PaymentType(stage=stage, payment_name=payment['name'], default_amount=payment['amount'], description=f"Payment for {payment['name']}").save()

    print("Stages and payment types seeded successfully.")
