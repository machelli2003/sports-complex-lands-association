from main import create_app
from app.models import PaymentType

app = create_app()
with app.app_context():
    PaymentType.objects.delete()
    print("Deleted all existing payment types")

    from setup_payment_types import *
    print("Re-ran setup")
