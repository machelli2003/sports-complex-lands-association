from main import create_app
from app.models import User
from werkzeug.security import generate_password_hash


def create_admin_user(password: str = 'admin123'):
    app = create_app()

    with app.app_context():
        admin = User.objects(username='admin').first()

        if admin:
            print("User 'admin' already exists. Updating password...")
            admin.password_hash = generate_password_hash(password, method='pbkdf2:sha256')
            admin.save()
        else:
            print("Creating new 'admin' user...")
            User(username='admin', full_name='System Administrator', role='admin', password_hash=generate_password_hash(password, method='pbkdf2:sha256')).save()

        print("[OK] Admin user ready.")
        print("Username: admin")
        print(f"Password: {password}")


if __name__ == '__main__':
    create_admin_user()
