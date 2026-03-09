import os

# __file__ is always the config.py absolute path when the module is imported
_HERE = os.path.abspath(os.path.dirname(__file__))
_INSTANCE_DIR = os.path.join(_HERE, 'instance')
os.makedirs(_INSTANCE_DIR, exist_ok=True)

_DB_FILE = os.path.join(_INSTANCE_DIR, 'sports_complex.db')

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'super-secret-key')
    # SQLAlchemy/SQLite settings removed; app now uses MongoEngine (MongoDB).
    # If you need to run legacy migration scripts they may still read the
    # existing SQLite DB file in `instance/` but the running app uses MongoDB.
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'super-secret-key')
    UPLOAD_FOLDER = os.path.join(_INSTANCE_DIR, 'uploads')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    # MongoDB / MongoEngine settings (use MongoDB Atlas URI via MONGO_URI or MONGODB_URI)
    # Support multiple env var names to match `.env` variants
    MONGO_URI = os.environ.get('MONGO_URI') or os.environ.get('MONGODB_URI') or os.environ.get('MONGODB_HOST') or ''
    MONGODB_HOST = os.environ.get('MONGO_URI') or os.environ.get('MONGODB_URI') or os.environ.get('MONGODB_HOST') or ''
