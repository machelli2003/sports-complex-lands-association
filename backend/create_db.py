import os
import sys

# Ensure we run from the backend directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

instance_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance')
os.makedirs(instance_dir, exist_ok=True)
db_path = os.path.join(instance_dir, 'sports_complex.db')

from main import create_app
import mongoengine as me
from app import models

app = create_app()

with app.app_context():
    # Ensure MongoEngine connection is active (main.create_app triggers connection)
    try:
        # Ask each document class to ensure indexes are created
        for doc in [
            models.LocalAssociation,
            models.Stage,
            models.PaymentType,
            models.User,
            models.Client,
            models.ClientStage,
            models.Payment,
            models.ClientPaymentType,
            models.ClientDocument,
            models.Setting,
            models.AuditLog
        ]:
            try:
                doc.ensure_indexes()
            except Exception:
                # ignore index creation errors during initial setup
                pass

        print("MongoDB collections and indexes ensured.")
        print(f"Mongo URI: {app.config.get('MONGO_URI')}")
    except Exception as e:
        print(f"Error ensuring indexes: {e}")
