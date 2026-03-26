import os

# Absolute path to the directory containing this file (backend root)
_HERE = os.path.abspath(os.path.dirname(__file__))

# Instance directory for local file storage (uploads, receipts, legacy SQLite)
_INSTANCE_DIR = os.path.join(_HERE, 'instance')
os.makedirs(_INSTANCE_DIR, exist_ok=True)


class Config:
    # ------------------------------------------------------------------ #
    #  Security
    # ------------------------------------------------------------------ #
    SECRET_KEY = os.environ.get('SECRET_KEY', 'super-secret-key')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'super-secret-key')

    # ------------------------------------------------------------------ #
    #  MongoDB / MongoEngine
    #  flask-mongoengine reads MONGODB_HOST from Flask config automatically.
    #  We support three env-var names so local .env and Render both work.
    # ------------------------------------------------------------------ #
    MONGODB_HOST = (
        os.environ.get('MONGODB_URI') or
        os.environ.get('MONGO_URI') or
        os.environ.get('MONGODB_HOST') or
        ''
    )

    # ------------------------------------------------------------------ #
    #  File storage
    # ------------------------------------------------------------------ #
    UPLOAD_FOLDER = os.path.join(_INSTANCE_DIR, 'uploads')
    RECEIPTS_FOLDER = os.path.join(_INSTANCE_DIR, 'receipts')

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(RECEIPTS_FOLDER, exist_ok=True)