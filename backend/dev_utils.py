"""Development utilities consolidated from standalone debug scripts.
These functions are non-destructive and avoid printing sensitive data.
They can be run from `main.py`'s debug-runner or imported interactively.
"""
from main import create_app
from app.models import User, Stage, PaymentType
from mongoengine import connection
import requests
import os


def list_users():
    app = create_app()
    with app.app_context():
        users = User.objects()
        print(f"Total users found: {len(users)}")
        for u in users:
            print(f"Username: {u.username}, Role: {u.role}")


def inspect_stage_3():
    app = create_app()
    with app.app_context():
        stage_3 = Stage.objects(stage_number=3).first()
        if not stage_3:
            print("Stage 3 not found!")
            return
        print(f"Stage 3 found: {stage_3.stage_name} (ID: {stage_3.id})")
        print("Existing payment types in Stage 3:")
        payment_types = PaymentType.objects(stage=stage_3.id)
        for pt in payment_types:
            print(f"- {pt.payment_name} (Amount: {pt.default_amount})")


def show_stages_and_payment_types():
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


def db_info(out_path=None):
    app = create_app()
    with app.app_context():
        try:
            db = connection.get_db()
            print(f"Connected to MongoDB: {db.name}")
            collections = db.list_collection_names()
            print(f"Collections: {collections}")
            if out_path:
                with open(out_path, 'w') as out:
                    out.write(f"MongoDB name: {db.name}\n")
                    out.write(f"Collections: {collections}\n")
                    for c in collections:
                        try:
                            count = db[c].count_documents({})
                        except Exception:
                            count = 'n/a'
                        out.write(f"  {c}: {count}\n")
        except Exception as e:
            print(f"Error connecting to MongoDB: {e}")


def login_check():
    """Verify admin login works with current password without printing sensitive hashes."""
    app = create_app()
    with app.app_context():
        user = User.objects(username='admin').first()
        if not user:
            print('Admin user not found')
            return False
        # Use the same logic as the login route to avoid exposing hashes
        from werkzeug.security import check_password_hash
        result = check_password_hash(user.password_hash, 'admin123')
        print(f'Login check result for admin: {result}')
        return result


def health_check(base_url=None):
    base = base_url or 'http://127.0.0.1:5001/api'
    try:
        r = requests.get(f"{base}/settings", timeout=5)
        print(f"/settings -> {r.status_code}")
    except Exception as e:
        print(f"Settings request failed: {e}")


if __name__ == '__main__':
    # Run a small smoke test when executed directly
    print('dev_utils: running quick db_info and inspect_stage_3')
    db_info()
    inspect_stage_3()
