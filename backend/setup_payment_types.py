from main import create_app

app = create_app()
with app.app_context():
    from app.models import Stage, PaymentType

    payment_types_config = {
        1: [
            {'name': 'Registration fee', 'amount': 1500}
        ],
        2: [
            {'name': 'Site plan', 'amount': 3000},
            {'name': 'Ground rent', 'amount': 8500},
            {'name': 'Indenture', 'amount': 15000}
        ],
        3: [
            {'name': 'PVLMD fee', 'amount': 15000}
        ],
        4: [
            {'name': 'Stamping', 'amount': 3500}
        ],
        5: [
            {'name': 'Collection fee', 'amount': 15000}
        ]
    }

    stages = Stage.objects.order_by('stage_number')
    print("Current stages:")
    for s in stages:
        print(f"  Stage {s.stage_number}: {s.stage_name} (ID: {s.id})")

    for stage in stages:
        if stage.stage_number in payment_types_config:
            configs = payment_types_config[stage.stage_number]
            for config in configs:
                existing = PaymentType.objects(stage=stage, payment_name=config['name']).first()

                if existing:
                    if existing.default_amount != config['amount']:
                        existing.default_amount = config['amount']
                        existing.save()
                        print(f"Updated {config['name']} for {stage.stage_name}: {config['amount']}")
                else:
                    payment_type = PaymentType(
                        stage=stage,
                        payment_name=config['name'],
                        default_amount=config['amount'],
                        description=f'Payment for {config["name"]}'
                    )
                    payment_type.save()
                    print(f"Created {config['name']} for {stage.stage_name}: {config['amount']}")

    print("\nPayment types setup complete!")

    total = sum(pt.default_amount for pt in PaymentType.objects)
    print(f"Total expected amount: GHS {int(total):,}")
