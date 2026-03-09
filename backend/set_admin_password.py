import os
from werkzeug.security import generate_password_hash
from main import create_app

app = create_app()

def set_admin_password(password='admin123'):
    with app.app_context():
        from app.models import User
        hashed = generate_password_hash(password, method='pbkdf2:sha256')
        admin = User.objects(username='admin').first()
        if admin:
            admin.password_hash = hashed
            admin.save()
            print('Admin password updated.')
        else:
            admin = User(username='admin', full_name='System Administrator', role='admin', password_hash=hashed)
            admin.save()
            print('Admin user created.')

if __name__ == '__main__':
    set_admin_password()
