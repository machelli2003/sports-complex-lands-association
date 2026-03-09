from main import create_app
from app.models import Stage, PaymentType

app = create_app()

with app.app_context():
    # Find Stage 3
    stage_3 = Stage.objects(stage_number=3).first()
    if not stage_3:
        print("Error: Stage 3 not found!")
    else:
        print(f"Found Stage 3: {stage_3.stage_name} (ID: {stage_3.id})")

        # Check if payment type exists
        name = "Physical Planning & Report"
        existing = PaymentType.objects(stage=stage_3.id, payment_name__iexact=name).first()

        if existing:
            print(f"Payment type '{existing.payment_name}' already exists in Stage 3.")
        else:
            new_pt = PaymentType(
                stage=stage_3,
                payment_name=name,
                default_amount=0.0,
                description="Physical Planning & Report"
            )
            new_pt.save()
            print(f"Successfully added '{name}' to Stage 3.")
