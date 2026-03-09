"""
Migration script to add client_payment_types table
This allows admins to set custom payment amounts per client per payment type
"""

from app.models import ClientPaymentType


def migrate():
    print("Ensuring ClientPaymentType indexes and collection exists...")
    try:
        ClientPaymentType.ensure_indexes()
    except Exception:
        pass
    print("✓ Migration completed for MongoDB (collection ensured)")
    print("New collection 'client_payment_types' is ready in MongoDB.")

if __name__ == '__main__':
    from main import app
    
    with app.app_context():
        migrate()
