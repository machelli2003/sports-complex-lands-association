import sqlite3
import os

from main import create_app
from app.models import User


def migrate_users(sqlite_path=None):
    sqlite_path = sqlite_path or os.path.join('backend', 'instance', 'sports_complex.db')
    if not os.path.exists(sqlite_path):
        print('SQLite DB not found at', sqlite_path)
        return

    conn = sqlite3.connect(sqlite_path)
    cur = conn.cursor()
    cur.execute("SELECT user_id, username, full_name, role, password_hash FROM users")
    rows = cur.fetchall()

    app = create_app()
    with app.app_context():
        for r in rows:
            user_id, username, full_name, role, password_hash = r
            print(f"Migrating user: {username}")
            existing = User.objects(username=username).first()
            if existing:
                existing.full_name = full_name
                existing.role = role
                if password_hash:
                    existing.password_hash = password_hash
                existing.save()
                print(f"  Updated {username}")
            else:
                u = User(
                    username=username,
                    full_name=full_name or username,
                    role=role or 'staff',
                    password_hash=password_hash
                )
                u.save()
                print(f"  Created {username}")

    conn.close()


if __name__ == '__main__':
    migrate_users()
